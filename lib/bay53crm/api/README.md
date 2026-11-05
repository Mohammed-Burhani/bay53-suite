# CRM API client

Typed client for the Bay53 CRM backend (swagger: https://baycrmapi.bay53.in/swagger/index.html). The ERP/POS backend client lives in `lib/api`; this one is separate (different host, JWT Bearer auth).

```
schema.d.ts      generated from swagger. Refresh with `npm run crm:types`. Do not edit.
types.ts         CrmSchemas alias over schema.d.ts (request bodies)
dto.ts           response shapes seen on the live API (swagger has none); extend per module
client.ts        crmHttp: Bearer token, drops it on 401, JSON / multipart / blob
token-store.ts   JWT storage
auth.ts          crmAuth.login / logout
queries/*.ts     TanStack Query layer: key factories, queryOptions, hooks, mutations (import from `.../api/queries`)
services/*.ts    one `<tag>Api` per swagger tag, one method per endpoint (name = operation name)
```

Browser calls go to `/api/crm/*`, a same-origin proxy (`app/api/crm/[...path]/route.ts`) to `CRM_API_BASE_URL_STAGE` (stage only for now; the URL includes `/api`); the upstream sends no CORS headers.

## Integrating an endpoint

1. Call the service from a hook in `lib/hooks/`. Endpoints already in `dto.ts` default `<T>` to their DTO; for the rest add the DTO to `dto.ts` from a real response and set it as the method's default `<T>`.
2. Use the hook from `queries/` (or `queryOptions` for prefetching). Mutations invalidate the related query roots listed in `queries/keys.ts`.
3. Swap the mock in `lib/bay53crm/crm.service.ts` for the API call, one module at a time.
4. Keep the UI-facing types in `lib/bay53crm/types.ts`; map DTO -> UI type in one place.

## Behaviour to know

- The API answers 200 with `{ hasError, message, data }`. `crmHttp` unwraps it: the result is `data`, and `hasError` throws `CrmApiError`. So `<T>` is the shape of `data`.
- No token refresh: `Accounts/refresh-token` answers "Invalid token" to a Bearer-only call and login sets no cookie. The JWT lasts ~30 days; a 401 clears it and the caller re-logs in.
- Some endpoints answer without a token, others 401 (`{ message }`). Do not rely on that: always log in first.
- Tests: `npm test` (client behaviour: envelope, query string, 401 handling).
