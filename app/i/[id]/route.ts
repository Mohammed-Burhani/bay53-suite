// GET /i/<id>
// Short public link to a shared invoice PDF (see /api/invoice-share-link). Redirects to a
// short-lived signed storage URL. The id is unguessable and the link expires after
// INVOICE_LINK_TTL_MS, the only access control, so this route is intentionally unauthenticated.

import { NextResponse } from "next/server";
import { logsDb } from "@/lib/activity-log/server";
import { INVOICE_LINK_TTL_MS, INVOICE_SHARE_BUCKET } from "@/lib/invoice-share";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9]{10}$/.test(id)) return new NextResponse("Not found", { status: 404 });

  const storage = logsDb().storage.from(INVOICE_SHARE_BUCKET);
  const { data: files } = await storage.list(id, { limit: 1 });
  const file = files?.[0];
  const createdAt = file?.created_at ? Date.parse(file.created_at) : NaN;
  if (!file || Number.isNaN(createdAt) || Date.now() - createdAt > INVOICE_LINK_TTL_MS) {
    return new NextResponse("This invoice link has expired or does not exist.", { status: 404 });
  }

  const { data, error } = await storage.createSignedUrl(`${id}/${file.name}`, 60, { download: file.name });
  if (error || !data) return new NextResponse("Could not open the invoice.", { status: 500 });

  return NextResponse.redirect(data.signedUrl, 302);
}
