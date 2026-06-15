// Route configuration for tab titles and icons
export const ROUTE_CONFIG: Record<string, { title: string; icon?: string }> = {
  "/dashboard": { title: "Dashboard" },
  "/onboarding": { title: "Get Started" },
  
  // Inventory
  "/inventory": { title: "All Products" },
  "/inventory/add": { title: "Add Product" },
  "/inventory/categories": { title: "Categories" },
  "/inventory/low-stock": { title: "Low Stock" },
  
  // Sales
  "/pos": { title: "POS" },
  "/sales": { title: "Sales" },
  "/sales/create": { title: "Create Invoice" },
  "/sales/returns": { title: "Sales Returns" },
  "/sales/certificates": { title: "Certificates" },
  
  // Purchases
  "/purchases": { title: "Purchases" },
  "/purchases/create": { title: "New Purchase" },
  "/purchases/orders": { title: "Purchase Orders" },
  "/purchases/returns": { title: "Purchase Returns" },
  
  // Parties
  "/parties": { title: "Parties" },
  "/parties/customers": { title: "Customers" },
  "/parties/suppliers": { title: "Suppliers" },
  "/parties/add": { title: "Add Party" },
  
  // Certificates
  "/certificates": { title: "Certificates" },
  
  // Master
  "/master/groups": { title: "Groups" },
  "/master/groups/create": { title: "Create Group" },

  // Reports
  "/reports": { title: "Reports" },
  "/reports/current-stock": { title: "Current Stock" },
  "/reports/inventory-report": { title: "Inventory Report" },
  "/reports/item-register": { title: "Item Register" },
  "/reports/pending-items": { title: "Pending Items" },
  "/reports/ledger-outstanding": { title: "Ledger Outstanding" },
  "/reports/ledger-outstanding-summary": { title: "Outstanding Summary" },
  "/reports/ledger-balances": { title: "Ledger Balances" },
  "/reports/ledger-register": { title: "Ledger Register" },
  "/reports/day-book": { title: "Day Book" },
  "/reports/gst-filing": { title: "GST Filing" },
  
  // AI & Settings
  "/ai-assistant": { title: "AI Assistant" },
  "/settings": { title: "Settings" },
};

export function getRouteTitle(path: string): string {
  return ROUTE_CONFIG[path]?.title || path.split("/").pop()?.replace(/-/g, " ") || "Page";
}
