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

## Integrated screens

- Leads (`components/bay53crm/leads`): Lead/List, Lead/Get, Lead/Add, Lead/UpdateLead, Lead/UpdateLeadTitle, Lead/Delete, LeadCommon/ListLeadFollowUp, LeadCommon/AddLeadFollowUp, Accounts/ListAllUser, Contact/List. Stage names and the filter/request helpers are in `lib/bay53crm/leads.ts`.
- Projects (`components/bay53crm/projects`): Campaign/List, Campaign/Get, Campaign/Add, Campaign/Update, Campaign/Delete, MasterValue/List (type 4, the brand approval segments). The API calls a project a campaign; the consultant is stored in `description`. Status ids, make list and request builders are in `lib/bay53crm/projects.ts`.
- Dashboard (`components/bay53crm/dashboard/DashboardView.tsx`): Common/FYList, Common/DashboardResult, Lead/List, Notification/UserNotificationList, Notification/MarkReadNotification. Chart data is built in `lib/bay53crm/dashboard.ts`.
- Company (`components/bay53crm/company`): Company/Get, Company/Update (a single company, id 1).
- Temporary CRM login: `components/bay53crm/shared/CrmLoginGate.tsx` wraps every CRM screen from `app/crm/layout.tsx`. Delete it (and its use there) once the CRM API accepts the main app login.

- Reports (`components/bay53crm/reports`): Report/LeadDetailsReportList, LeadActivityReportList, CampaignDetailsReportList, SalesStageStatusReportList. A report runs when "View Report" is clicked (`enabled` on the hooks). Criteria builders and row summaries are in `lib/bay53crm/reports.ts`; `ReportFrame` holds the shared layout.
- User reports (`components/bay53crm/dashboard/UserReportsView.tsx`): Common/FYList, Lead/List, Accounts/ListAllUser. Filters and groupings are in `lib/bay53crm/dashboard.ts`.
- CMS master values (`components/bay53crm/cms/MasterValuesView.tsx`): MasterValue/List, Add, Update, Delete for type 4 (brand approval). The lead stage, project status and make list tabs are fixed lists in the code, shown read-only.
- CMS notification master (`components/bay53crm/cms/NotificationMasterView.tsx`): Notification/List, read-only (see the quirks below).

- Lead tabs (`components/bay53crm/leads/LeadRecords.tsx`): LeadCommon follow-ups (add, edit, mark done, delete), activities, notes, attachments, LeadDetailsCount (tab counts), ListLeadHistory (stage history), Common/EnquiryList + QuatationList + LeadCommon/UpdateLeadEnquiry (`LeadEnquiry.tsx`). Request builders and file helpers are in `lib/bay53crm/records.ts`.
- Project tabs (`components/bay53crm/projects/ProjectRecords.tsx`): Campaign activities, attachments, UpdateNote; Campaign/ConsultantNameList feeds the consultant suggestions in `ProjectForm`.
- Contacts and customers (`components/bay53crm/contacts`): Contact/List, Add, Update, Delete, CompanyList (the company picker) and Customer/List (read-only). Helpers in `lib/bay53crm/contacts.ts`.
- Message templates and email settings (`components/bay53crm/cms`): CustomMessage and EmailSetting CRUD. Helpers in `lib/bay53crm/settings.ts`.
- Email (`components/bay53crm/email`): GetEmail, Important, Bookmark, Trash, the mark/flag/bookmark/delete actions, SendEmail, AddEmailAsLead, Download. Helpers in `lib/bay53crm/email.ts`. NOT verified live: see the quirks.
- Not built: Company/Add (the CRM has one company, edited in Company Settings), Email/GetEmailThread, Email/GetContacts, Email/GetEmailLeads, Common/ExternalSiteLink, LeadCommon/GetLeadEmail and ListLeadEmail, the Get-by-id calls that the list already covers.

`lib/bay53crm/crm.service.ts`, `data.ts` and `lib/hooks/useCRM.ts` are the old mock layer. No screen uses them any more (`FollowUpLog.tsx` is also unused now).

## Stage API quirks (seen live)

- Lead/Add, Lead/UpdateLead and Lead/UpdateLeadTitle save the record, then answer `hasError` ("Invalid domain token at offset 11") when the notification email fails. `tolerateNotification` (`lib/bay53crm/save.ts`) turns that into a warning toast; use it around every lead save.
- Contact/List ignores `companyName` and returns every contact (about 5.5k rows), some with no `companyName`. The contact picker filters in the browser.
- MasterValue/ActiveList answers an empty list for every type; use MasterValue/List. MasterValue/List needs a `type`: without one it answers an empty list. Only type 4 (brand approval) has rows on stage; types 1-3 and 5-10 are empty.
- Notification/Get does not return a rule's `sqlText`, recipients or suppressions, and sends `repeatsAt` as "11:00:00" where Notification/List sends a time object. A rule cannot be saved back safely from what the API returns, so the notification screen is read-only. All four rules on stage are system rules.
- Report/LeadActivityReportList rows have a text `type` ("1" to "7") whose meaning does not match the notes, so the report does not show it. It returns every activity (about 2,000 rows) when no criteria are set, so the screen pages the rows.
- Report/SalesStageStatusReportList has stage ids 0-15. 11 Won, 12 Lost, 14 Tender Won and 15 Tender Lost belong to archived leads, which Lead/List only returns with `isArchive: true` (their names were read from those leads). `avgTimeSpent` has no documented unit (values 113 to 38,275), so it is not shown.
- Report/CampaignDetailsReportList has no assignee filter and `companyRegion` is never set on projects, so the project report filters by assignee in the browser and offers no region.
- LeadCommon/DownloadAttachmentFile and Campaign/DownloadAttachmentFile answer 200 with `{"hasError":true,"message":"Index was outside the bounds of the array."}` for every file name format tried (the stored `filePath`, the full `path`, with a folder or id in front, with `|` or `_`), even for a file uploaded a minute earlier. Uploads, listings and deletes work. The attachment panels show the server's message when a download fails (`requireFile` in `lib/bay53crm/records.ts`). Needs a fix on the backend.
- Upload endpoints take multipart `files` (the file), `id` (the lead or campaign id) and `name` (the label shown in the list).
- LeadCommon add/update/delete of an activity store the record but answer "Invalid domain token at offset 11" (the notification email fails), like Lead/Add. Follow-ups, notes and the campaign calls do not. `tolerateNotification` is used around all of them.
- Common/QuatationList filters by the enquiry NUMBER as text (`{ enquiry: "97064" }`); the enquiry reference text ("LIV-PUNE/HL/IN-ENQ/97064/2026-27") and a `token` are ignored and return all 28,028 quotations. Common/EnquiryList takes `clientDetailId` (the lead's `customerRef`).
- Contact/Get and Contact/List only return name, company, phones, email and companyRef; the add/update model has more fields (address, city, birth date, ...) that are never read back, so the contact form only edits those it can show. Whether Contact/Update clears the others is not known.
- Campaign/ConsultantNameList returns every description ever typed, including "-" and multi-line notes; `consultantSuggestions` keeps the short single-line names.
- Email/* answers "Authentication failed" (GetEmail) or "The LOGIN command is disabled." on stage and EmailSetting/List is empty, so the mailbox screen has not been run against real mail. Common/ExternalSiteLink returns "http://localhost:5051/".
- Common/PieChartResult answers "The method or operation is not implemented"; the dashboard builds its charts from Lead/List.
- Common/DashboardResult `yearlyActualRevenue` equals 12 x `monthlyTargetRevenue` (the yearly target), not won revenue. Won and lost values are not in the response.
- Lead/List has no source or status, so there is no leads-by-source chart.
