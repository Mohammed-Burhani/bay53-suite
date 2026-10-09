'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  Info,
  Loader2,
  Receipt,
  ScanLine,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  EXTRACT_DELAY_MS,
  mockExtract,
  toISODate,
  type ExtractedBill,
  type ExtractedLine,
} from './bill-extraction-mock';

const EASE = [0.16, 1, 0.3, 1] as const;
const MIN_READABLE_PX = 400;
const LINE_LIMITS = [10, 15, 20, 25];

type BillStatus = 'queued' | 'reading' | 'done' | 'error';

interface Bill {
  id: string;
  seq: number;
  preview?: string;
  dims?: { w: number; h: number };
  status: BillStatus;
  error?: string;
  data?: ExtractedBill;
}

interface InvoiceLine {
  key: string;
  name: string;
  unit: string;
  qty: number;
  rate: number;
  gst: number;
  sources: number[];
  lowConfidence: boolean;
}

interface DraftInvoice {
  lines: InvoiceLine[];
  taxable: number;
  tax: number;
  roundOff: number;
  total: number;
}

interface CreatedInvoice {
  number: string;
  lines: number;
  total: number;
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const newId = () => Math.random().toString(36).slice(2, 10);
const lineKey = (l: Pick<ExtractedLine, 'name' | 'rate'>) => `${l.name}@${l.rate}`;

function totals(lines: Pick<InvoiceLine, 'qty' | 'rate' | 'gst'>[]) {
  const taxable = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const tax = lines.reduce((s, l) => s + (l.qty * l.rate * l.gst) / 100, 0);
  const total = Math.round(taxable + tax);
  return { taxable, tax, roundOff: total - (taxable + tax), total };
}

function readImageDims(src: string): Promise<{ w: number; h: number } | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    // HEIC and friends don't decode in most browsers; let the reader decide.
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

export function BillPhotoUpload() {
  const reduceMotion = useReducedMotion();
  const [bills, setBills] = useState<Bill[]>([]);
  const [linesPerInvoice, setLinesPerInvoice] = useState(15);
  const [edits, setEdits] = useState<Record<string, Partial<Pick<InvoiceLine, 'qty' | 'rate'>>>>({});
  const [removedLines, setRemovedLines] = useState<Set<string>>(new Set());
  const [invoiceDate, setInvoiceDate] = useState(() => toISODate(new Date()));
  const [activeInvoice, setActiveInvoice] = useState(0);
  const [hoveredBills, setHoveredBills] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedInvoice[] | null>(null);

  const seqRef = useRef(0);
  const cameraRef = useRef<HTMLInputElement>(null);
  const billsRef = useRef(bills);
  useEffect(() => {
    billsRef.current = bills;
  }, [bills]);

  useEffect(
    () => () => {
      billsRef.current.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
    },
    []
  );

  // ── Adding bills ────────────────────────────────────────────────────────
  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const added = await Promise.all(
      files.map(async (file): Promise<Bill> => {
        const preview = URL.createObjectURL(file);
        return {
          id: newId(),
          seq: ++seqRef.current,
          preview,
          dims: await readImageDims(preview),
          status: 'queued',
        };
      })
    );
    setBills((prev) => [...prev, ...added]);
  }, []);

  const addSamples = () => {
    const samples: Bill[] = [1, 2, 3].map(() => ({ id: newId(), seq: ++seqRef.current, status: 'queued' }));
    setBills((prev) => [...prev, ...samples]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: addFiles,
    onDropRejected: (rejections) => {
      toast.error(
        `${rejections.length} file${rejections.length > 1 ? 's' : ''} skipped. Only bill photos (JPG, PNG, HEIC, WebP) can be added.`
      );
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  // ── Extraction queue: one bill at a time ────────────────────────────────
  const readingId = bills.find((b) => b.status === 'reading')?.id;
  const nextQueuedId = bills.find((b) => b.status === 'queued')?.id;

  useEffect(() => {
    if (readingId || !nextQueuedId) return;
    setBills((prev) => prev.map((b) => (b.id === nextQueuedId ? { ...b, status: 'reading' } : b)));
  }, [readingId, nextQueuedId]);

  useEffect(() => {
    if (!readingId) return;
    const timer = setTimeout(() => {
      setBills((prev) =>
        prev.map((b) => {
          if (b.id !== readingId) return b;
          if (b.dims && Math.min(b.dims.w, b.dims.h) < MIN_READABLE_PX) {
            return { ...b, status: 'error', error: 'Too small to read. Retake it closer.' };
          }
          return { ...b, status: 'done', data: mockExtract(b.seq) };
        })
      );
    }, EXTRACT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [readingId]);

  // ── Removing bills ──────────────────────────────────────────────────────
  const removeBill = (bill: Bill) => {
    if (bill.preview) URL.revokeObjectURL(bill.preview);
    setBills((prev) => prev.filter((b) => b.id !== bill.id));
    setHoveredBills([]);
    // Merged quantities change when a bill leaves, so manual edits on its lines no longer apply.
    if (bill.data) {
      const keys = new Set(bill.data.lines.map(lineKey));
      setEdits((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !keys.has(k))));
    }
  };

  const resetAll = () => {
    bills.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
    setBills([]);
    setEdits({});
    setRemovedLines(new Set());
    setActiveInvoice(0);
    setHoveredBills([]);
    setCreated(null);
  };

  // ── Consolidation ───────────────────────────────────────────────────────
  const doneBills = useMemo(
    () => bills.filter((b) => b.status === 'done' && b.data).sort((a, b) => a.seq - b.seq),
    [bills]
  );
  const pendingCount = bills.filter((b) => b.status === 'queued' || b.status === 'reading').length;

  const lines = useMemo(() => {
    const merged = new Map<string, InvoiceLine>();
    for (const bill of doneBills) {
      for (const l of bill.data!.lines) {
        const key = lineKey(l);
        const existing = merged.get(key);
        if (existing) {
          existing.qty += l.qty;
          existing.sources.push(bill.seq);
          existing.lowConfidence ||= !!l.lowConfidence;
        } else {
          merged.set(key, { ...l, key, sources: [bill.seq], lowConfidence: !!l.lowConfidence });
        }
      }
    }
    return [...merged.values()]
      .filter((l) => !removedLines.has(l.key))
      .map((l) => (edits[l.key] ? { ...l, ...edits[l.key], lowConfidence: false } : l));
  }, [doneBills, edits, removedLines]);

  const invoices = useMemo<DraftInvoice[]>(() => {
    const chunks: InvoiceLine[][] = [];
    for (let i = 0; i < lines.length; i += linesPerInvoice) chunks.push(lines.slice(i, i + linesPerInvoice));
    return chunks.map((chunk) => ({ lines: chunk, ...totals(chunk) }));
  }, [lines, linesPerInvoice]);

  const active = Math.min(activeInvoice, Math.max(invoices.length - 1, 0));
  const current = invoices[active];
  const grandTotal = invoices.reduce((s, inv) => s + inv.total, 0);
  const flaggedCount = lines.filter((l) => l.lowConfidence).length;
  const repeatedCount = lines.filter((l) => l.sources.length > 1).length;

  const updateLine = (key: string, field: 'qty' | 'rate', value: number) =>
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const removeLine = (key: string) => setRemovedLines((prev) => new Set(prev).add(key));

  const createInvoices = () => {
    setCreating(true);
    setTimeout(() => {
      setCreated(
        invoices.map((inv, i) => ({
          number: `INV-${String(412 + i).padStart(5, '0')}`,
          lines: inv.lines.length,
          total: inv.total,
        }))
      );
      setCreating(false);
      toast.success(invoices.length > 1 ? `${invoices.length} invoices created` : 'Invoice created');
    }, 900);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" aria-label="Back to POS">
            <Link href="/pos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ScanLine className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Bill to Invoice</h1>
          <Badge variant="secondary">Prototype</Badge>
        </div>

        {!created && (
          <div className="flex items-center gap-2">
            <Label htmlFor="lines-per-invoice" className="text-sm font-normal text-muted-foreground">
              Lines per invoice
            </Label>
            <Select value={String(linesPerInvoice)} onValueChange={(v) => setLinesPerInvoice(Number(v))}>
              <SelectTrigger id="lines-per-invoice" size="sm" className="w-[72px] tabular-nums">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINE_LIMITS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {created ? (
        <CreatedView
          created={created}
          billCount={doneBills.length}
          onStartNew={resetAll}
          reduceMotion={!!reduceMotion}
        />
      ) : (
        <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
          {/* ── Left: capture + bill list ── */}
          <section aria-label="Bills" className="space-y-5">
            <Panel>
              <div {...getRootProps()} className="relative p-5">
                <input {...getInputProps()} />
                <h2 className="text-base font-semibold">Add bills</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Photograph each bill. Items, quantities and rates are read automatically.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button className="h-11 gap-2 active:scale-[0.98]" onClick={() => cameraRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                    Take photo
                  </Button>
                  <Button variant="outline" className="h-11 gap-2 active:scale-[0.98]" onClick={open}>
                    <ImagePlus className="h-4 w-4" />
                    Upload photos
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Or drop photos here. JPG, PNG, HEIC or WebP.
                </p>

                <AnimatePresence>
                  {isDragActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="absolute inset-2 flex flex-col items-center justify-center gap-2 rounded-[0.625rem] border-2 border-dashed border-primary bg-card/95"
                    >
                      <ImagePlus className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Drop to add bills</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Panel>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />

            <div className="space-y-3">
              <div className="flex h-7 items-center justify-between px-1">
                <h2 className="text-sm font-medium">
                  Bills <span className="ml-1 tabular-nums text-muted-foreground">{bills.length}</span>
                </h2>
                {bills.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={resetAll}>
                    Clear all
                  </Button>
                )}
              </div>

              {bills.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
                  <Receipt className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No bills yet</p>
                  <p className="mx-auto mt-1 max-w-[30ch] text-sm text-muted-foreground">
                    Add one bill or a whole stack. Each one is read as soon as it is added.
                  </p>
                  <Button variant="link" size="sm" className="mt-1" onClick={addSamples}>
                    Try with 3 sample bills
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {bills.map((bill) => (
                      <BillRow
                        key={bill.id}
                        bill={bill}
                        highlighted={hoveredBills.includes(bill.seq)}
                        reduceMotion={!!reduceMotion}
                        onHover={(on) => setHoveredBills(on ? [bill.seq] : [])}
                        onRemove={() => removeBill(bill)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </section>

          {/* ── Right: consolidated invoice ── */}
          <section aria-label="Invoice preview" className="lg:sticky lg:top-6">
            <Panel>
              {!current ? (
                pendingCount > 0 ? (
                  <InvoiceSkeleton />
                ) : (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold">Your invoice builds here</h2>
                    <p className="mt-1 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
                      Items from every bill are merged into one invoice. Past {linesPerInvoice} lines, the
                      rest move to a second invoice automatically.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4">
                    <div>
                      <h2 className="text-base font-semibold">
                        {invoices.length > 1 ? `${invoices.length} invoices` : 'Invoice'} from {doneBills.length}{' '}
                        {doneBills.length === 1 ? 'bill' : 'bills'}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lines.length} lines
                        {repeatedCount > 0 && `, ${repeatedCount} combined from more than one bill`}
                      </p>
                    </div>

                    {invoices.length > 1 && (
                      <div role="tablist" aria-label="Invoices" className="inline-flex rounded-xl bg-muted p-1">
                        {invoices.map((inv, i) => (
                          <button
                            key={i}
                            role="tab"
                            aria-selected={i === active}
                            onClick={() => setActiveInvoice(i)}
                            className={cn(
                              'rounded-lg px-3 py-1.5 text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                              i === active
                                ? 'bg-card font-medium text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            Invoice {i + 1}
                            <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                              {inv.lines.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 px-5">
                    {invoices.length > 1 && (
                      <Notice icon={Info}>
                        {lines.length} lines are over the {linesPerInvoice}-line limit, so they were split across{' '}
                        {invoices.length} invoices.
                      </Notice>
                    )}
                    {flaggedCount > 0 && (
                      <Notice icon={AlertTriangle} tone="warning">
                        {flaggedCount} {flaggedCount === 1 ? 'line was' : 'lines were'} hard to read. Check the
                        highlighted values.
                      </Notice>
                    )}
                    {pendingCount > 0 && (
                      <Notice icon={Loader2} spin>
                        Still reading {pendingCount} {pendingCount === 1 ? 'bill' : 'bills'}. Their items will appear
                        here.
                      </Notice>
                    )}
                  </div>

                  <div className="px-5 pt-4">
                    <div className="max-w-[220px] space-y-2">
                      <Label htmlFor="invoice-date">Invoice date</Label>
                      <Input
                        id="invoice-date"
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 overflow-x-auto border-y border-border">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="w-10 py-2.5 pl-5 font-medium">#</th>
                          <th className="py-2.5 font-medium">Item</th>
                          <th className="py-2.5 pr-2 text-right font-medium">Qty</th>
                          <th className="py-2.5 pr-2 text-right font-medium">Rate</th>
                          <th className="py-2.5 text-right font-medium">GST</th>
                          <th className="py-2.5 pr-2 text-right font-medium">Amount</th>
                          <th className="w-10 pr-3">
                            <span className="sr-only">Remove</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 border-t border-border">
                        {current.lines.map((line, i) => (
                          <tr
                            key={line.key}
                            onMouseEnter={() => setHoveredBills(line.sources)}
                            onMouseLeave={() => setHoveredBills([])}
                            className={cn(
                              'group transition-colors duration-200',
                              line.sources.some((s) => hoveredBills.includes(s)) ? 'bg-primary/[0.06]' : 'hover:bg-muted/40'
                            )}
                          >
                            <td className="py-2.5 pl-5 align-top tabular-nums text-muted-foreground">
                              {active * linesPerInvoice + i + 1}
                            </td>
                            <td className="py-2.5 pr-3 align-top">
                              <p className="font-medium leading-snug">{line.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                {line.sources.map((s) => (
                                  <span
                                    key={s}
                                    className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground"
                                  >
                                    Bill {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-1.5 pr-2 text-right align-top">
                              <NumberCell
                                label={`Quantity for ${line.name}`}
                                value={line.qty}
                                suffix={line.unit}
                                flagged={line.lowConfidence}
                                onCommit={(v) => updateLine(line.key, 'qty', v)}
                              />
                            </td>
                            <td className="py-1.5 pr-2 text-right align-top">
                              <NumberCell
                                label={`Rate for ${line.name}`}
                                value={line.rate}
                                flagged={line.lowConfidence}
                                onCommit={(v) => updateLine(line.key, 'rate', v)}
                              />
                            </td>
                            <td className="py-2.5 text-right align-top tabular-nums text-muted-foreground">
                              {line.gst}%
                            </td>
                            <td className="py-2.5 pr-2 text-right align-top font-medium tabular-nums">
                              {inr.format(line.qty * line.rate)}
                            </td>
                            <td className="py-2 pr-3 text-right align-top">
                              <button
                                onClick={() => removeLine(line.key)}
                                aria-label={`Remove ${line.name}`}
                                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end px-5 py-4">
                    <dl className="w-full max-w-xs space-y-1.5 text-sm">
                      <TotalRow label="Taxable value" value={current.taxable} />
                      <TotalRow label="GST" value={current.tax} />
                      <TotalRow label="Round off" value={current.roundOff} />
                      <div className="flex items-baseline justify-between border-t border-border pt-2.5">
                        <dt className="font-medium">
                          {invoices.length > 1 ? `Invoice ${active + 1} total` : 'Total'}
                        </dt>
                        <dd className="text-lg font-semibold tabular-nums">{inr.format(current.total)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-4">
                    <div className="text-sm">
                      {invoices.length > 1 ? (
                        <>
                          <p className="text-muted-foreground">All {invoices.length} invoices</p>
                          <p className="font-semibold tabular-nums">{inr.format(grandTotal)}</p>
                        </>
                      ) : pendingCount > 0 ? (
                        <p className="text-muted-foreground">Waiting for the remaining bills</p>
                      ) : (
                        <p className="text-muted-foreground">Review the lines, then create.</p>
                      )}
                    </div>
                    <Button
                      size="lg"
                      className="group gap-2 pr-2 active:scale-[0.98]"
                      disabled={creating || pendingCount > 0 || lines.length === 0}
                      onClick={createInvoices}
                    >
                      {creating
                        ? 'Creating'
                        : invoices.length > 1
                          ? `Create ${invoices.length} invoices`
                          : 'Create invoice'}
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-foreground/15 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5">
                        {creating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────

/** Nested shell + core container used for the two main surfaces. */
function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[1.25rem] bg-muted/60 p-1.5 ring-1 ring-border/70', className)}>
      <div className="overflow-hidden rounded-[0.875rem] bg-card shadow-[0_1px_2px_oklch(0.2_0.03_170/0.06),0_12px_32px_-16px_oklch(0.2_0.03_170/0.18)]">
        {children}
      </div>
    </div>
  );
}

function BillRow({
  bill,
  highlighted,
  reduceMotion,
  onHover,
  onRemove,
}: {
  bill: Bill;
  highlighted: boolean;
  reduceMotion: boolean;
  onHover: (on: boolean) => void;
  onRemove: () => void;
}) {
  const summary = bill.data ? totals(bill.data.lines) : null;
  const toCheck = bill.data?.lines.filter((l) => l.lowConfidence).length ?? 0;

  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
      transition={{ duration: 0.35, ease: EASE }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border bg-card p-2 pr-2.5 transition-colors duration-200',
        bill.status === 'error'
          ? 'border-destructive/40'
          : highlighted
            ? 'border-primary/50 bg-primary/[0.04]'
            : 'border-border'
      )}
    >
      <BillThumb bill={bill} reduceMotion={reduceMotion} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">Bill {bill.seq}</span>
          {bill.data && (
            <span className="truncate text-xs tabular-nums text-muted-foreground">
              {bill.data.billNo}, {fmtDate(bill.data.date)}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs">
          {bill.status === 'queued' && <span className="text-muted-foreground">Waiting to read</span>}
          {bill.status === 'reading' && (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Reading items
            </span>
          )}
          {bill.status === 'done' && summary && (
            <span className="text-muted-foreground">
              {bill.data!.lines.length} items, <span className="tabular-nums text-foreground">{inr.format(summary.total)}</span>
              {toCheck > 0 && <span className="text-amber-600 dark:text-amber-400">, {toCheck} to check</span>}
            </span>
          )}
          {bill.status === 'error' && <span className="text-destructive">{bill.error}</span>}
        </div>
      </div>

      <button
        onClick={onRemove}
        aria-label={`Remove bill ${bill.seq}`}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.li>
  );
}

function BillThumb({ bill, reduceMotion }: { bill: Bill; reduceMotion: boolean }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = bill.preview && !failed;

  return (
    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bill.preview}
          alt={`Bill ${bill.seq}`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        // Sample bills and undecodable formats (HEIC on most browsers) get a paper stand-in.
        <div className="flex h-full w-full flex-col gap-1 bg-white p-1.5 dark:bg-zinc-100" aria-hidden>
          <div className="h-1 w-2/3 rounded-full bg-zinc-300" />
          {[90, 70, 80, 60, 75].map((w, i) => (
            <div key={i} className="h-0.5 rounded-full bg-zinc-200" style={{ width: `${w}%` }} />
          ))}
          <div className="mt-auto h-1 w-1/2 self-end rounded-full bg-zinc-300" />
        </div>
      )}

      {bill.status === 'reading' && (
        <div className="absolute inset-0 bg-primary/10">
          {!reduceMotion && (
            <motion.div
              className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
              initial={{ y: '-100%' }}
              animate={{ y: '300%' }}
              transition={{ duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: [0.65, 0, 0.35, 1] }}
            />
          )}
        </div>
      )}
      {bill.status === 'done' && (
        <div className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-3 w-3" />
        </div>
      )}
      {bill.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/15">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
      )}
    </div>
  );
}

function NumberCell({
  value,
  label,
  suffix,
  flagged,
  onCommit,
}: {
  value: number;
  label: string;
  suffix?: string;
  flagged: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(draft);
    if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n);
    setDraft(null);
  };

  return (
    <span className="inline-flex flex-col items-end">
      <input
        type="number"
        min={0}
        inputMode="decimal"
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={cn(
          'w-20 rounded-md bg-transparent px-2 py-1 text-right tabular-nums outline-none transition-colors',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          'hover:bg-muted focus:bg-background focus:ring-2 focus:ring-ring/40',
          flagged && 'bg-amber-500/10 ring-1 ring-amber-500/50 hover:bg-amber-500/15'
        )}
      />
      {suffix && <span className="pr-2 text-[11px] text-muted-foreground">{suffix}</span>}
    </span>
  );
}

function Notice({
  icon: Icon,
  tone = 'info',
  spin,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'info' | 'warning';
  spin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm',
        tone === 'warning'
          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
          : 'bg-primary/[0.07] text-foreground/80'
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          tone === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-primary',
          spin && 'animate-spin'
        )}
      />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="tabular-nums">{inr.format(value)}</dd>
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="p-5" aria-busy="true" aria-label="Reading bills">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-4 w-32" />
      <Skeleton className="mt-6 h-9 max-w-[220px]" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-6 w-40" />
      </div>
    </div>
  );
}

function CreatedView({
  created,
  billCount,
  onStartNew,
  reduceMotion,
}: {
  created: CreatedInvoice[];
  billCount: number;
  onStartNew: () => void;
  reduceMotion: boolean;
}) {
  const totalLines = created.reduce((s, c) => s + c.lines, 0);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto w-full max-w-xl px-4 py-12"
    >
      <Panel>
        <div className="p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            {created.length > 1 ? `${created.length} invoices created` : 'Invoice created'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Walk-in sale, {totalLines} lines from {billCount} {billCount === 1 ? 'bill' : 'bills'}.
          </p>

          <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
            {created.map((inv) => (
              <li key={inv.number} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-mono font-medium">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">{inv.lines} lines</p>
                </div>
                <p className="font-semibold tabular-nums">{inr.format(inv.total)}</p>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-muted-foreground">Prototype only. Nothing was saved.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={onStartNew} className="active:scale-[0.98]">
              New batch
            </Button>
            <Button asChild variant="outline">
              <Link href="/pos">Back to POS</Link>
            </Button>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}
