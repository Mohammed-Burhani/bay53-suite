// POST /api/print-invoice
// Server-side proxy to the print API (see lib/print-upstream.ts). Returns the PDF bytes.

import { fetchInvoicePdf } from "@/lib/print-upstream";

export async function POST(req: Request) {
  const upstream = await fetchInvoicePdf(await req.text());

  if (!upstream.ok) {
    return new Response(upstream.statusText, { status: upstream.status });
  }

  return new Response(await upstream.arrayBuffer(), {
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/pdf" },
  });
}
