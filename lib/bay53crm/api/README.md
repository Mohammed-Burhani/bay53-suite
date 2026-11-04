# CRM API client

Typed client for the Bay53 CRM backend (swagger: https://baycrmapi.bay53.in/swagger/index.html). The ERP/POS backend client lives in `lib/api`; this one is separate (different host, JWT Bearer auth).

```
schema.d.ts      generated from swagger. Refresh with `npm run crm:types`. Do not edit.
types.ts         CrmSchemas alias over schema.d.ts
client.ts        crmHttp: Bearer token, one refresh+retry on 401, JSON / multipart / blob
token-store.ts   JWT storage
auth.ts          crmAuth.login / logout
services/*.ts    one `<tag>Api` per swagger tag, one method per endpoint (name = operation name)
```

Browser calls go to `/api/crm/*`, a same-origin proxy (`app/api/crm/[...path]/route.ts`) to `CRM_API_BASE_URL`; the upstream sends no CORS headers.

## Integrating an endpoint

1. Call the service from a hook in `lib/hooks/` with the response DTO: `leadApi.list<LeadDto>(params)`. Swagger has no response schemas, so define the DTO next to the hook (or in `lib/bay53crm/types.ts`) from a real response.
2. Swap the mock in `lib/bay53crm/crm.service.ts` for the API call, one module at a time.
3. Keep the UI-facing types in `lib/bay53crm/types.ts`; map DTO -> UI type in one place.

## Behaviour to know

- The API answers 200 with `{ hasError, message, data }`. `crmHttp` unwraps it: the result is `data`, and `hasError` throws `CrmApiError`. So `<T>` is the shape of `data`.
- Refresh relies on the upstream refresh-token cookie passing through the proxy. Untested until a real login works.
