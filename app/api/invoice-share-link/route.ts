// POST /api/invoice-share-link
// Body: PrintInvoicePayload + { fileName }. Renders the invoice PDF through the print API, stores
// it in a private Supabase Storage bucket and returns a time-limited signed download URL that the
// client puts in the WhatsApp message (a wa.me link cannot attach a file).
//
// Requires a valid ERP session (same Authorization + actor headers as the activity log routes).

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { identifyCaller, logsDb } from "@/lib/activity-log/server";
import { fetchInvoicePdf } from "@/lib/print-upstream";

const BUCKET = "invoice-shares";
const LINK_TTL_SECONDS = 7 * 24 * 60 * 60;

async function ensureBucket() {
  const db = logsDb();
  const { error } = await db.storage.createBucket(BUCKET, { public: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  return db;
}

export async function POST(req: Request) {
  const caller = await identifyCaller(req, true);
  if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });

  let payload: { fileName?: string } & Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { fileName, ...printPayload } = payload;
  const safeName = (typeof fileName === "string" ? fileName : "invoice.pdf").replace(/[^\w.\- ]/g, "_").slice(0, 100);

  const upstream = await fetchInvoicePdf(JSON.stringify(printPayload));
  if (!upstream.ok) {
    return NextResponse.json({ error: `Print API failed: ${upstream.statusText}` }, { status: 502 });
  }
  const pdf = await upstream.arrayBuffer();

  try {
    const db = await ensureBucket();
    const path = `${caller.actor.company_code}/${randomUUID()}/${safeName}`;
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(path, pdf, { contentType: "application/pdf" });
    if (uploadError) throw uploadError;

    const { data, error: signError } = await db.storage
      .from(BUCKET)
      .createSignedUrl(path, LINK_TTL_SECONDS, { download: safeName });
    if (signError || !data) throw signError ?? new Error("No signed URL");

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("invoice-share-link failed:", err);
    return NextResponse.json({ error: "Could not store the invoice PDF" }, { status: 500 });
  }
}
