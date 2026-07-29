// Route configuration for tab titles and icons
export const ROUTE_CONFIG: Record<string, { title: string; icon?: string }> = {
  // ERP
  "/erp/dashboard": { title: "Dashboard" },
  "/erp/onboarding": { title: "Get Started" },

  // Inventory
  "/erp/inventory": { title: "All Products" },
  "/erp/inventory/add": { title: "Add Product" },
  "/erp/inventory/categories": { title: "Categories" },
  "/erp/inventory/low-stock": { title: "Low Stock" },

  // Sales
  "/erp/sales": { title: "Sales" },
  "/erp/sales/create": { title: "Create Invoice" },
  "/erp/sales/returns": { title: "Sales Returns" },
  "/erp/sales/certificates": { title: "Certificates" },

  // Purchases
  "/erp/purchases": { title: "Purchases" },
  "/erp/purchases/orders": { title: "Purchase Orders" },
  "/erp/purchases/returns": { title: "Purchase Returns" },

  // Parties
  "/erp/parties": { title: "Parties" },
  "/erp/parties/customers": { title: "Customers" },
  "/erp/parties/suppliers": { title: "Suppliers" },
  "/erp/parties/add": { title: "Add Party" },

  // Certificates
  "/erp/certificates": { title: "Certificates" },

  // Master
  "/erp/master/groups": { title: "Groups" },
  "/erp/master/groups/create": { title: "Create Group" },

  // Reports
  "/erp/reports": { title: "Reports" },
  "/erp/reports/current-stock": { title: "Current Stock" },
  "/erp/reports/inventory-report": { title: "Inventory Report" },
  "/erp/reports/item-register": { title: "Item Register" },
  "/erp/reports/pending-items": { title: "Pending Items" },
  "/erp/reports/ledger-outstanding": { title: "Ledger Outstanding" },
  "/erp/reports/ledger-balances": { title: "Ledger Balances" },
  "/erp/reports/ledger-register": { title: "Ledger Register" },
  "/erp/reports/day-book": { title: "Day Book" },
  "/erp/reports/gst-filing": { title: "GST Filing" },

  // AI & Settings
  "/erp/ai-assistant": { title: "AI Assistant" },
  "/erp/settings": { title: "Settings" },

  // POS
  "/pos": { title: "POS" },
  "/pos/inventory": { title: "POS Inventory" },
  "/pos/history": { title: "POS History" },

  // CRM
  "/crm/dashboard": { title: "CRM Dashboard" },
  "/crm/leads": { title: "CRM Leads" },
  "/crm/projects": { title: "CRM Projects" },
  "/crm/reports": { title: "CRM Reports" },
  "/crm/reports/lead-details": { title: "Lead Details Report" },
  "/crm/reports/lead-activity": { title: "Lead Activity Report" },
  "/crm/reports/project-details": { title: "Project Details Report" },
  "/crm/reports/sales-stage-status": { title: "Sales Stage Status Report" },
  "/crm/cms/master-values": { title: "Master Values" },
  "/crm/cms/notification-master": { title: "Notification Master" },
  "/crm/company": { title: "Company Settings" },
};

export function getRouteTitle(path: string): string {
  return ROUTE_CONFIG[path]?.title || path.split("/").pop()?.replace(/-/g, " ") || "Page";
}
