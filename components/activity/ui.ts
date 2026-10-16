import clsx from "clsx";
import {
  ArrowRightLeft,
  Ban,
  FileDown,
  FilePenLine,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Globe,
  IndianRupee,
  Mail,
  PackageMinus,
  PackagePlus,
  Percent,
  PencilLine,
  ReceiptText,
  Share2,
  Smartphone,
  Terminal,
  Cpu,
  Trash2,
  TriangleAlert,
  Info,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import type { ActionCode, Importance, Source } from "@/lib/activity-types";

export const cx = clsx;

// One radius scale for the whole module: rounded-md (6px).

export const panel =
  "rounded-md border border-border bg-card";

export const fieldCls =
  "h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] text-foreground placeholder:text-muted-foreground " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary " +
  "";

export const btnCls =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-3 " +
  "text-[13px] font-medium text-foreground hover:bg-accent active:translate-y-px disabled:pointer-events-none disabled:opacity-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary " +
  "";

export const btnPrimaryCls =
  "!border-primary !bg-primary !text-primary-foreground hover:!bg-primary/90";

export const labelCls = "mb-1 block text-[11px] font-medium text-muted-foreground";

export const IMPORTANCE_STYLE: Record<
  Importance,
  { chip: string; dot: string; icon: LucideIcon; iconBox: string }
> = {
  info: {
    chip: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
    dot: "bg-sky-500",
    icon: Info,
    iconBox: "border-border text-muted-foreground",
  },
  important: {
    chip: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    dot: "bg-amber-500",
    icon: TriangleAlert,
    iconBox: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  critical: {
    chip: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
    dot: "bg-red-500",
    icon: OctagonAlert,
    iconBox: "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
  },
};

export const ACTION_ICON: Record<ActionCode, LucideIcon> = {
  "invoice.created": FilePlus2,
  "invoice.updated": FilePenLine,
  "item.added": PackagePlus,
  "item.edited": PencilLine,
  "item.removed": PackageMinus,
  "pdf.generated": FileText,
  "pdf.downloaded": FileDown,
  "invoice.status_changed": ArrowRightLeft,
  "invoice.total_changed": IndianRupee,
  "invoice.discount_changed": Percent,
  "invoice.tax_changed": ReceiptText,
  "invoice.emailed": Mail,
  "invoice.shared": Share2,
  "invoice.voided": Ban,
  "invoice.deleted": Trash2,
  "invoice.edited_after_sent": FileWarning,
  "price.override": TriangleAlert,
  "export.csv": FileSpreadsheet,
};

export const SOURCE_ICON: Record<Source, LucideIcon> = {
  web: Globe,
  mobile: Smartphone,
  api: Terminal,
  system: Cpu,
};
