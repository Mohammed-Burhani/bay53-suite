/**
 * Context Menu Presets
 * Pre-configured context menu items for common module actions
 */

import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Mail,
  Printer,
  FileText,
  Download,
  Send,
  RotateCcw,
  XCircle,
  Package,
  RefreshCw,
  History,
  Archive,
  PackageCheck,
  DollarSign,
  Ban,
  User,
  BookOpen,
  FileDown,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Share2,
  Phone,
  MapPin,
} from "lucide-react";
import { ContextMenuItem } from "./context-menu";

// Sales & Invoices
export const createSalesContextMenu = (
  invoice: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onPrint: (id: string) => void;
    onEmail: (id: string) => void;
    onDuplicate: (id: string) => void;
    onConvertToReturn?: (id: string) => void;
    onCancel: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Invoice",
    icon: Eye,
    onClick: () => handlers.onView(invoice.id),
    shortcut: "⌘V",
  },
  {
    label: "Edit",
    icon: Edit,
    onClick: () => handlers.onEdit(invoice.id),
    disabled: invoice.status === "cancelled",
  },
  {
    label: "Print",
    icon: Printer,
    onClick: () => handlers.onPrint(invoice.id),
    shortcut: "⌘P",
  },
  {
    label: "Email Invoice",
    icon: Mail,
    onClick: () => handlers.onEmail(invoice.id),
    variant: "success",
  },
  {
    label: "Duplicate",
    icon: Copy,
    onClick: () => handlers.onDuplicate(invoice.id),
    divider: true,
  },
  ...(handlers.onConvertToReturn
    ? [
        {
          label: "Convert to Return",
          icon: RotateCcw,
          onClick: () => handlers.onConvertToReturn!(invoice.id),
        } as ContextMenuItem,
      ]
    : []),
  {
    label: "Cancel Invoice",
    icon: XCircle,
    onClick: () => handlers.onCancel(invoice.id),
    variant: "danger" as const,
    disabled: invoice.status === "cancelled",
    divider: true,
  },
];

// Inventory
export const createInventoryContextMenu = (
  item: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onAdjustStock: (id: string) => void;
    onViewHistory: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onArchive: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Details",
    icon: Package,
    onClick: () => handlers.onView(item.id),
  },
  {
    label: "Edit Item",
    icon: Edit,
    onClick: () => handlers.onEdit(item.id),
  },
  {
    label: "Adjust Stock",
    icon: RefreshCw,
    onClick: () => handlers.onAdjustStock(item.id),
    variant: "success",
  },
  {
    label: "View History",
    icon: History,
    onClick: () => handlers.onViewHistory(item.id),
    divider: true,
  },
  ...(handlers.onDuplicate
    ? [
        {
          label: "Duplicate Item",
          icon: Copy,
          onClick: () => handlers.onDuplicate!(item.id),
        } as ContextMenuItem,
      ]
    : []),
  {
    label: "Archive",
    icon: Archive,
    onClick: () => handlers.onArchive(item.id),
    variant: "danger" as const,
  },
];

// Purchases
export const createPurchaseContextMenu = (
  purchase: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onReceiveStock: (id: string) => void;
    onMarkPaid: (id: string) => void;
    onPrint?: (id: string) => void;
    onCancel: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Purchase Order",
    icon: FileText,
    onClick: () => handlers.onView(purchase.id),
  },
  {
    label: "Edit",
    icon: Edit,
    onClick: () => handlers.onEdit(purchase.id),
    disabled: purchase.status === "received",
  },
  {
    label: "Receive Stock",
    icon: PackageCheck,
    onClick: () => handlers.onReceiveStock(purchase.id),
    variant: "success",
    disabled: purchase.status === "received",
  },
  {
    label: "Mark as Paid",
    icon: DollarSign,
    onClick: () => handlers.onMarkPaid(purchase.id),
    disabled: purchase.payment_status === "paid",
  },
  ...(handlers.onPrint
    ? [
        {
          label: "Print PO",
          icon: Printer,
          onClick: () => handlers.onPrint!(purchase.id),
          divider: true,
        } as ContextMenuItem,
      ]
    : []),
  {
    label: "Cancel Order",
    icon: Ban,
    onClick: () => handlers.onCancel(purchase.id),
    variant: "danger" as const,
    disabled: purchase.status === "cancelled",
  },
];

// Parties (Customers/Suppliers)
export const createPartyContextMenu = (
  party: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onViewLedger: (id: string) => void;
    onSendStatement: (id: string) => void;
    onCall?: (phone: string) => void;
    onViewLocation?: (address: string) => void;
    onBlock: (id: string) => void;
    onDelete: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Details",
    icon: User,
    onClick: () => handlers.onView(party.id),
  },
  {
    label: "Edit",
    icon: Edit,
    onClick: () => handlers.onEdit(party.id),
  },
  {
    label: "View Ledger",
    icon: BookOpen,
    onClick: () => handlers.onViewLedger(party.id),
  },
  {
    label: "Send Statement",
    icon: Mail,
    onClick: () => handlers.onSendStatement(party.id),
    variant: "success",
    divider: true,
  },
  ...(handlers.onCall && party.phone
    ? [
        {
          label: "Call",
          icon: Phone,
          onClick: () => handlers.onCall!(party.phone),
        } as ContextMenuItem,
      ]
    : []),
  ...(handlers.onViewLocation && party.address
    ? [
        {
          label: "View Location",
          icon: MapPin,
          onClick: () => handlers.onViewLocation!(party.address),
          divider: true,
        } as ContextMenuItem,
      ]
    : []),
  {
    label: party.blocked ? "Unblock" : "Block",
    icon: Ban,
    onClick: () => handlers.onBlock(party.id),
    variant: "danger" as const,
  },
  {
    label: "Delete",
    icon: Trash2,
    onClick: () => handlers.onDelete(party.id),
    variant: "danger" as const,
  },
];

// Reports
export const createReportContextMenu = (
  record: any,
  handlers: {
    onExportPDF: () => void;
    onExportExcel: () => void;
    onEmail?: () => void;
    onPrint: () => void;
    onShare?: () => void;
  }
): ContextMenuItem[] => [
  {
    label: "Export PDF",
    icon: FileDown,
    onClick: handlers.onExportPDF,
  },
  {
    label: "Export Excel",
    icon: FileSpreadsheet,
    onClick: handlers.onExportExcel,
  },
  ...(handlers.onEmail
    ? [
        {
          label: "Email Report",
          icon: Mail,
          onClick: handlers.onEmail,
          variant: "success" as const,
        } as ContextMenuItem,
      ]
    : []),
  {
    label: "Print",
    icon: Printer,
    onClick: handlers.onPrint,
    shortcut: "⌘P",
  },
  ...(handlers.onShare
    ? [
        {
          label: "Share",
          icon: Share2,
          onClick: handlers.onShare,
          divider: true,
        } as ContextMenuItem,
      ]
    : []),
];

// Stock Management
export const createStockContextMenu = (
  stock: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onAdjust: (id: string) => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onDelete: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Details",
    icon: Eye,
    onClick: () => handlers.onView(stock.id),
  },
  {
    label: "Edit",
    icon: Edit,
    onClick: () => handlers.onEdit(stock.id),
    disabled: stock.status === "approved",
  },
  {
    label: "Adjust",
    icon: RefreshCw,
    onClick: () => handlers.onAdjust(stock.id),
  },
  ...(handlers.onApprove && stock.status === "pending"
    ? [
        {
          label: "Approve",
          icon: CheckCircle,
          onClick: () => handlers.onApprove!(stock.id),
          variant: "success" as const,
          divider: true,
        } as ContextMenuItem,
      ]
    : []),
  ...(handlers.onReject && stock.status === "pending"
    ? [
        {
          label: "Reject",
          icon: XCircle,
          onClick: () => handlers.onReject!(stock.id),
          variant: "danger" as const,
        } as ContextMenuItem,
      ]
    : []),
  {
    label: "Delete",
    icon: Trash2,
    onClick: () => handlers.onDelete(stock.id),
    variant: "danger" as const,
    divider: stock.status !== "pending",
  },
];

// Certificates
export const createCertificateContextMenu = (
  certificate: any,
  handlers: {
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDownload: (id: string) => void;
    onPrint: (id: string) => void;
    onEmail: (id: string) => void;
    onRevoke?: (id: string) => void;
  }
): ContextMenuItem[] => [
  {
    label: "View Certificate",
    icon: FileText,
    onClick: () => handlers.onView(certificate.id),
  },
  {
    label: "Edit",
    icon: Edit,
    onClick: () => handlers.onEdit(certificate.id),
    disabled: certificate.status === "revoked",
  },
  {
    label: "Download PDF",
    icon: Download,
    onClick: () => handlers.onDownload(certificate.id),
  },
  {
    label: "Print",
    icon: Printer,
    onClick: () => handlers.onPrint(certificate.id),
    shortcut: "⌘P",
  },
  {
    label: "Email",
    icon: Mail,
    onClick: () => handlers.onEmail(certificate.id),
    variant: "success",
    divider: true,
  },
  ...(handlers.onRevoke && certificate.status !== "revoked"
    ? [
        {
          label: "Revoke",
          icon: Ban,
          onClick: () => handlers.onRevoke!(certificate.id),
          variant: "danger" as const,
        } as ContextMenuItem,
      ]
    : []),
];
