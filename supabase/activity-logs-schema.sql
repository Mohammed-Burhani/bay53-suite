-- ==================== Activity & Event Logs ====================
-- Audit trail for the ERP modules (invoices first).
--
-- activity_logs       one row per business action (invoice created / updated / deleted / printed …)
-- activity_api_calls  every .NET API call made while performing that action, with status and message
-- event_logs          lightweight UI events (button clicks, page opens) with no payload
--
-- Access model: ERP users authenticate against the .NET API, not Supabase Auth, so RLS cannot
-- identify them. These tables are therefore server-only: RLS is on with NO policies and every
-- privilege is revoked from anon/authenticated. Only the Next.js server (service_role key) reads
-- and writes them, after validating the caller's .NET session.
--
-- Rows are append-only: a trigger rejects UPDATE and DELETE for every role, service_role included.

-- ---------- activity_logs ----------
create table if not exists public.activity_logs (
  id               bigint generated always as identity primary key,
  -- Client-generated, so a retried upload never stores the same action twice.
  event_id         uuid not null unique,
  occurred_at      timestamptz not null,
  recorded_at      timestamptz not null default now(),

  company_code     text not null,
  company_name     text,
  actor_user_id    integer not null,
  actor_name       text,
  actor_email      text,
  -- true when the server confirmed actor_user_id owns the session via /Auth/CheckSession.
  -- Name, email and company are still client-asserted until CheckSession returns them.
  actor_verified   boolean not null default false,

  module           text not null,
  action           text not null,
  importance       text not null default 'info' check (importance in ('info', 'important', 'critical')),
  outcome          text not null check (outcome in ('success', 'failure')),
  entity_type      text,
  entity_id        text,
  entity_label     text,
  inv_type         smallint,
  summary          text,
  error_message    text,
  changes          jsonb,
  metadata         jsonb not null default '{}'::jsonb,
  duration_ms      integer,

  ip               inet,
  user_agent       text,
  page             text
);

create index if not exists activity_logs_company_time_idx
  on public.activity_logs (company_code, occurred_at desc, id desc);
create index if not exists activity_logs_entity_idx
  on public.activity_logs (company_code, entity_type, entity_id, occurred_at desc);
create index if not exists activity_logs_actor_idx
  on public.activity_logs (company_code, actor_user_id, occurred_at desc);
create index if not exists activity_logs_action_idx
  on public.activity_logs (company_code, action, occurred_at desc);

-- ---------- activity_api_calls ----------
create table if not exists public.activity_api_calls (
  id               bigint generated always as identity primary key,
  activity_id      bigint not null references public.activity_logs (id),
  seq              smallint not null,
  method           text not null,
  endpoint         text not null,
  -- null when the request never got a response (network error, CORS, timeout).
  http_status      smallint,
  ok               boolean not null,
  message          text,
  -- Response body, redacted and truncated by the server before insert.
  response         jsonb,
  started_at       timestamptz not null,
  duration_ms      integer,
  unique (activity_id, seq)
);

-- ---------- event_logs ----------
create table if not exists public.event_logs (
  id               bigint generated always as identity primary key,
  event_id         uuid not null unique,
  occurred_at      timestamptz not null,
  recorded_at      timestamptz not null default now(),
  company_code     text not null,
  actor_user_id    integer not null,
  actor_name       text,
  actor_verified   boolean not null default false,
  module           text not null,
  event            text not null,
  target           text,
  page             text,
  metadata         jsonb not null default '{}'::jsonb
);

create index if not exists event_logs_company_time_idx
  on public.event_logs (company_code, occurred_at desc, id desc);
create index if not exists event_logs_actor_idx
  on public.event_logs (company_code, actor_user_id, occurred_at desc);

-- ---------- Append-only guard ----------
create or replace function public.reject_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Log tables are append-only (% on %)', tg_op, tg_table_name;
end;
$$;

drop trigger if exists activity_logs_append_only on public.activity_logs;
create trigger activity_logs_append_only
  before update or delete on public.activity_logs
  for each row execute function public.reject_log_mutation();

drop trigger if exists activity_api_calls_append_only on public.activity_api_calls;
create trigger activity_api_calls_append_only
  before update or delete on public.activity_api_calls
  for each row execute function public.reject_log_mutation();

drop trigger if exists event_logs_append_only on public.event_logs;
create trigger event_logs_append_only
  before update or delete on public.event_logs
  for each row execute function public.reject_log_mutation();

-- ---------- Atomic insert of an action and its API calls ----------
-- Takes a JSON array of actions, each with an "api_calls" array. A repeated event_id is
-- skipped (with its calls), so client retries are safe. Returns how many actions were new.
create or replace function public.insert_activity_logs(entries jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  entry     jsonb;
  new_id    bigint;
  inserted  integer := 0;
begin
  for entry in select * from jsonb_array_elements(entries) loop
    insert into public.activity_logs (
      event_id, occurred_at, company_code, company_name, actor_user_id, actor_name, actor_email,
      actor_verified, module, action, importance, outcome, entity_type, entity_id, entity_label,
      inv_type, summary, error_message, changes, metadata, duration_ms, ip, user_agent, page
    ) values (
      (entry->>'event_id')::uuid,
      (entry->>'occurred_at')::timestamptz,
      entry->>'company_code',
      entry->>'company_name',
      (entry->>'actor_user_id')::integer,
      entry->>'actor_name',
      entry->>'actor_email',
      coalesce((entry->>'actor_verified')::boolean, false),
      entry->>'module',
      entry->>'action',
      coalesce(entry->>'importance', 'info'),
      entry->>'outcome',
      entry->>'entity_type',
      entry->>'entity_id',
      entry->>'entity_label',
      (entry->>'inv_type')::smallint,
      entry->>'summary',
      entry->>'error_message',
      entry->'changes',
      coalesce(entry->'metadata', '{}'::jsonb),
      (entry->>'duration_ms')::integer,
      (entry->>'ip')::inet,
      entry->>'user_agent',
      entry->>'page'
    )
    on conflict (event_id) do nothing
    returning id into new_id;

    if new_id is not null then
      inserted := inserted + 1;
      insert into public.activity_api_calls (
        activity_id, seq, method, endpoint, http_status, ok, message, response, started_at, duration_ms
      )
      select
        new_id,
        (c.ordinality - 1)::smallint,
        c.value->>'method',
        c.value->>'endpoint',
        (c.value->>'http_status')::smallint,
        (c.value->>'ok')::boolean,
        c.value->>'message',
        c.value->'response',
        (c.value->>'started_at')::timestamptz,
        (c.value->>'duration_ms')::integer
      from jsonb_array_elements(coalesce(entry->'api_calls', '[]'::jsonb)) with ordinality as c(value, ordinality);
    end if;
  end loop;
  return inserted;
end;
$$;

-- ---------- Lock down: server (service_role) only ----------
alter table public.activity_logs enable row level security;
alter table public.activity_api_calls enable row level security;
alter table public.event_logs enable row level security;

revoke all on public.activity_logs, public.activity_api_calls, public.event_logs from anon, authenticated, public;
revoke all on function public.insert_activity_logs(jsonb) from anon, authenticated, public;
revoke all on function public.reject_log_mutation() from anon, authenticated, public;

grant select, insert on public.activity_logs, public.activity_api_calls, public.event_logs to service_role;
grant execute on function public.insert_activity_logs(jsonb) to service_role;
