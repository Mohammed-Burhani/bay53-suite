// POST /api/invoice-share-link
// Body: PrintInvoicePayload + { fileName }. Renders the invoice PDF through the print API, stores
// it in a private Supabase Storage bucket and returns { id }: the client builds the short public
// link `<origin>/i/<id>` (served by app/i/[id]/route.ts) for the WhatsApp message, since a wa.me
// link cannot attach a file.
//
// Requires a valid ERP session (same Authorization + actor headers as the activity log routes).

import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { identifyCaller, logsDb } from "@/lib/activity-log/server";
import { INVOICE_SHARE_BUCKET } from "@/lib/invoice-share";
import { fetchInvoicePdf } from "@/lib/print-upstream";

const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// 10 chars from a 54-symbol alphabet is ~57 bits, enough to be unguessable.
function newShareId(): string {
  return Array.from(randomBytes(10), (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

async function ensureBucket() {
  const db = logsDb();
  const { error } = await db.storage.createBucket(INVOICE_SHARE_BUCKET, { public: false });
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
    const id = newShareId();
    const { error: uploadError } = await db.storage
      .from(INVOICE_SHARE_BUCKET)
      .upload(`${id}/${safeName}`, pdf, { contentType: "application/pdf" });
    if (uploadError) throw uploadError;

    return NextResponse.json({ id });
  } catch (err) {
    console.error("invoice-share-link failed:", err);
    return NextResponse.json({ error: "Could not store the invoice PDF" }, { status: 500 });
  }
}
