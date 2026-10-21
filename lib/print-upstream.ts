// Server-only: calls the print API. That API only allows CORS from specific origins
// (localhost), so browsers go through our own routes instead of calling it directly.

const PRINT_API_BASE = "https://printapi.bay53.in/api";

export function fetchInvoicePdf(body: string): Promise<Response> {
  return fetch(`${PRINT_API_BASE}/Print/PrintInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
}
