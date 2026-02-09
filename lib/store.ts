import { Product, Party, Invoice } from "./types";

// ==================== Mock Data ====================

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Samsung Galaxy M14 5G",
    sku: "SAM-M14-5G",
    barcode: "8901234567890",
    category: "Electronics",
    brand: "Samsung",
    description: "6GB RAM, 128GB Storage, 5000mAh Battery",
    costPrice: 11500,
    sellingPrice: 13490,
    mrp: 14999,
    gstRate: 18,
    hsnCode: "8517",
    unit: "Pcs",
    stock: 24,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "p2",
    name: "Tata Salt - 1kg",
    sku: "TATA-SALT-1KG",
    barcode: "8901058001013",
    category: "Grocery & FMCG",
    brand: "Tata",
    costPrice: 18,
    sellingPrice: 22,
    mrp: 24,
    gstRate: 5,
    hsnCode: "2501",
    unit: "Pcs",
    stock: 150,
    lowStockThreshold: 30,
    isActive: true,
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "p3",
    name: "Amul Butter - 500g",
    sku: "AMUL-BTR-500",
    category: "Grocery & FMCG",
    brand: "Amul",
    costPrice: 235,
    sellingPrice: 270,
    mrp: 280,
    gstRate: 12,
    hsnCode: "0405",
    unit: "Pcs",
    stock: 45,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: "2025-01-12T10:00:00Z",
    updatedAt: "2025-01-12T10:00:00Z",
  },
  {
    id: "p4",
    name: "Crocin Advance - 20 Tablets",
    sku: "CROC-ADV-20",
    category: "Pharmacy & Health",
    brand: "GSK",
    costPrice: 22,
    sellingPrice: 28,
    mrp: 30,
    gstRate: 12,
    hsnCode: "3004",
    unit: "Pack",
    stock: 3,
    lowStockThreshold: 15,
    isActive: true,
    createdAt: "2025-01-18T10:00:00Z",
    updatedAt: "2025-01-18T10:00:00Z",
  },
  {
    id: "p5",
    name: "Allen Solly Formal Shirt",
    sku: "AS-FSHIRT-42",
    category: "Clothing & Apparel",
    brand: "Allen Solly",
    costPrice: 850,
    sellingPrice: 1299,
    mrp: 1499,
    gstRate: 12,
    hsnCode: "6205",
    unit: "Pcs",
    stock: 18,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z",
  },
  {
    id: "p6",
    name: "Havells Fan Regulator",
    sku: "HAV-FAN-REG",
    category: "Electronics",
    brand: "Havells",
    costPrice: 320,
    sellingPrice: 450,
    mrp: 499,
    gstRate: 18,
    hsnCode: "8533",
    unit: "Pcs",
    stock: 2,
    lowStockThreshold: 5,
    isActive: true,
    createdAt: "2025-01-22T10:00:00Z",
    updatedAt: "2025-01-22T10:00:00Z",
  },
  {
    id: "p7",
    name: "Classmate Notebook - 200 Pages",
    sku: "CLS-NB-200",
    category: "Stationery & Office",
    brand: "Classmate",
    costPrice: 45,
    sellingPrice: 60,
    mrp: 65,
    gstRate: 12,
    hsnCode: "4820",
    unit: "Pcs",
    stock: 200,
    lowStockThreshold: 50,
    isActive: true,
    createdAt: "2025-01-25T10:00:00Z",
    updatedAt: "2025-01-25T10:00:00Z",
  },
  {
    id: "p8",
    name: "Bosch Drill Machine 13mm",
    sku: "BOSCH-DRL-13",
    category: "Hardware & Tools",
    brand: "Bosch",
    costPrice: 2800,
    sellingPrice: 3499,
    mrp: 3999,
    gstRate: 18,
    hsnCode: "8467",
    unit: "Pcs",
    stock: 8,
    lowStockThreshold: 3,
    isActive: true,
    createdAt: "2025-01-28T10:00:00Z",
    updatedAt: "2025-01-28T10:00:00Z",
  },
  {
    id: "p9",
    name: "Lakme Compact Powder",
    sku: "LAK-CMP-01",
    category: "Beauty & Personal Care",
    brand: "Lakme",
    costPrice: 180,
    sellingPrice: 225,
    mrp: 250,
    gstRate: 28,
    hsnCode: "3304",
    unit: "Pcs",
    stock: 35,
    lowStockThreshold: 10,
    isActive: true,
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "p10",
    name: "MRF Cricket Bat - English Willow",
    sku: "MRF-BAT-EW",
    category: "Sports & Fitness",
    brand: "MRF",
    costPrice: 4500,
    sellingPrice: 5999,
    mrp: 6999,
    gstRate: 18,
    hsnCode: "9506",
    unit: "Pcs",
    stock: 6,
    lowStockThreshold: 2,
    isActive: true,
    createdAt: "2025-02-03T10:00:00Z",
    updatedAt: "2025-02-03T10:00:00Z",
  },
];

const MOCK_PARTIES: Party[] = [
  {
    id: "c1",
    name: "Rajesh Kumar",
    type: "customer",
    phone: "9876543210",
    email: "rajesh@email.com",
    gstin: "07AAACR5055K1Z5",
    address: "45, Lajpat Nagar",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110024",
    balance: 15400,
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "c2",
    name: "Priya Sharma",
    type: "customer",
    phone: "9123456780",
    email: "priya.s@email.com",
    city: "Mumbai",
    state: "Maharashtra",
    balance: 0,
    createdAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "c3",
    name: "Ankit Patel",
    type: "customer",
    phone: "9988776655",
    city: "Ahmedabad",
    state: "Gujarat",
    balance: 3200,
    createdAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "s1",
    name: "Metro Wholesale Distributors",
    type: "supplier",
    phone: "9111222333",
    email: "metro@wholesale.com",
    gstin: "27AAACM1234K1Z5",
    address: "Industrial Area, Phase 2",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    balance: -45000,
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "s2",
    name: "Bharat Electronics Supply",
    type: "supplier",
    phone: "9444555666",
    email: "bharat.elec@email.com",
    gstin: "29AAACB5678K1Z5",
    city: "Bangalore",
    state: "Karnataka",
    balance: -12000,
    createdAt: "2025-01-03T10:00:00Z",
  },
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2025-001",
    type: "sale",
    partyId: "c1",
    partyName: "Rajesh Kumar",
    items: [
      {
        productId: "p1",
        productName: "Samsung Galaxy M14 5G",
        quantity: 1,
        unit: "Pcs",
        price: 13490,
        discount: 0,
        gstRate: 18,
        total: 13490,
      },
    ],
    subtotal: 13490,
    totalDiscount: 0,
    totalGst: 2428.2,
    grandTotal: 15918.2,
    amountPaid: 15918.2,
    paymentMode: "upi",
    status: "paid",
    date: "2025-02-06T10:00:00Z",
    createdAt: "2025-02-06T10:00:00Z",
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2025-002",
    type: "sale",
    partyId: "c2",
    partyName: "Priya Sharma",
    items: [
      {
        productId: "p5",
        productName: "Allen Solly Formal Shirt",
        quantity: 3,
        unit: "Pcs",
        price: 1299,
        discount: 100,
        gstRate: 12,
        total: 3797,
      },
      {
        productId: "p9",
        productName: "Lakme Compact Powder",
        quantity: 2,
        unit: "Pcs",
        price: 225,
        discount: 0,
        gstRate: 28,
        total: 450,
      },
    ],
    subtotal: 4247,
    totalDiscount: 100,
    totalGst: 581.64,
    grandTotal: 4728.64,
    amountPaid: 4728.64,
    paymentMode: "card",
    status: "paid",
    date: "2025-02-06T14:00:00Z",
    createdAt: "2025-02-06T14:00:00Z",
  },
  {
    id: "inv3",
    invoiceNumber: "INV-2025-003",
    type: "sale",
    partyId: "c3",
    partyName: "Ankit Patel",
    items: [
      {
        productId: "p8",
        productName: "Bosch Drill Machine 13mm",
        quantity: 2,
        unit: "Pcs",
        price: 3499,
        discount: 200,
        gstRate: 18,
        total: 6798,
      },
    ],
    subtotal: 6798,
    totalDiscount: 200,
    totalGst: 1223.64,
    grandTotal: 7821.64,
    amountPaid: 5000,
    paymentMode: "credit",
    status: "partial",
    date: "2025-02-05T10:00:00Z",
    createdAt: "2025-02-05T10:00:00Z",
  },
  {
    id: "inv4",
    invoiceNumber: "PUR-2025-001",
    type: "purchase",
    partyId: "s1",
    partyName: "Metro Wholesale Distributors",
    items: [
      {
        productId: "p2",
        productName: "Tata Salt - 1kg",
        quantity: 100,
        unit: "Pcs",
        price: 18,
        discount: 0,
        gstRate: 5,
        total: 1800,
      },
      {
        productId: "p3",
        productName: "Amul Butter - 500g",
        quantity: 50,
        unit: "Pcs",
        price: 235,
        discount: 0,
        gstRate: 12,
        total: 11750,
      },
    ],
    subtotal: 13550,
    totalDiscount: 0,
    totalGst: 1500,
    grandTotal: 15050,
    amountPaid: 15050,
    paymentMode: "bank_transfer",
    status: "paid",
    date: "2025-02-04T10:00:00Z",
    createdAt: "2025-02-04T10:00:00Z",
  },
];

// ==================== In-memory Store ====================

let products = [...MOCK_PRODUCTS];
let parties = [...MOCK_PARTIES];
let invoices = [...MOCK_INVOICES];
let invoiceCounter = 4;

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Products
export function getProducts(): Product[] {
  return [...products];
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
  const newProduct: Product = {
    ...product,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products = [newProduct, ...products];
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
  return products[idx];
}

export function deleteProduct(id: string): boolean {
  const len = products.length;
  products = products.filter((p) => p.id !== id);
  return products.length < len;
}

// Parties
export function getParties(type?: "customer" | "supplier"): Party[] {
  if (type) return parties.filter((p) => p.type === type);
  return [...parties];
}

export function getPartyById(id: string): Party | undefined {
  return parties.find((p) => p.id === id);
}

export function addParty(party: Omit<Party, "id" | "createdAt">): Party {
  const newParty: Party = {
    ...party,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  parties = [newParty, ...parties];
  return newParty;
}

export function updateParty(id: string, updates: Partial<Party>): Party | null {
  const idx = parties.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  parties[idx] = { ...parties[idx], ...updates };
  return parties[idx];
}

export function deleteParty(id: string): boolean {
  const len = parties.length;
  parties = parties.filter((p) => p.id !== id);
  return parties.length < len;
}

// Invoices
export function getInvoices(type?: "sale" | "purchase"): Invoice[] {
  if (type) return invoices.filter((i) => i.type === type);
  return [...invoices];
}

export function getInvoiceById(id: string): Invoice | undefined {
  return invoices.find((i) => i.id === id);
}

export function addInvoice(invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">): Invoice {
  invoiceCounter++;
  const prefix = invoice.type === "sale" ? "INV" : "PUR";
  const newInvoice: Invoice = {
    ...invoice,
    id: generateId(),
    invoiceNumber: `${prefix}-2025-${String(invoiceCounter).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
  };
  invoices = [newInvoice, ...invoices];

  // Update product stock
  for (const item of invoice.items) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      if (invoice.type === "sale") {
        product.stock = Math.max(0, product.stock - item.quantity);
      } else {
        product.stock += item.quantity;
      }
    }
  }

  return newInvoice;
}

// Dashboard
export function getDashboardMetrics(): {
  metrics: import("./types").DashboardMetrics;
  recentSales: Invoice[];
  salesByDay: { day: string; amount: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  categoryBreakdown: { category: string; count: number; value: number }[];
} {
  const today = new Date().toISOString().split("T")[0];
  const salesInvoices = invoices.filter((i) => i.type === "sale");
  const purchaseInvoices = invoices.filter((i) => i.type === "purchase");
  const customers = parties.filter((p) => p.type === "customer");
  const suppliers = parties.filter((p) => p.type === "supplier");
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);

  const totalSalesToday = salesInvoices
    .filter((i) => i.date.startsWith(today))
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalSalesMonth = salesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPurchasesMonth = purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

  const receivables = customers.reduce((s, c) => s + Math.max(0, c.balance), 0);
  const payables = suppliers.reduce((s, c) => s + Math.abs(Math.min(0, c.balance)), 0);

  // Sales by day (last 7 days)
  const salesByDay = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayAmount = salesInvoices
      .filter((inv) => inv.date.startsWith(dateStr))
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
    salesByDay.push({ day: dayNames[d.getDay()], amount: dayAmount || Math.random() * 25000 + 5000 });
  }

  // Top products by revenue
  const productRevenue: Record<string, { name: string; sold: number; revenue: number }> = {};
  for (const inv of salesInvoices) {
    for (const item of inv.items) {
      if (!productRevenue[item.productId]) {
        productRevenue[item.productId] = { name: item.productName, sold: 0, revenue: 0 };
      }
      productRevenue[item.productId].sold += item.quantity;
      productRevenue[item.productId].revenue += item.total;
    }
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Category breakdown
  const catMap: Record<string, { count: number; value: number }> = {};
  for (const p of products) {
    if (!catMap[p.category]) catMap[p.category] = { count: 0, value: 0 };
    catMap[p.category].count++;
    catMap[p.category].value += p.stock * p.sellingPrice;
  }
  const categoryBreakdown = Object.entries(catMap).map(([category, data]) => ({
    category,
    ...data,
  }));

  return {
    metrics: {
      totalSalesToday,
      totalSalesMonth,
      totalPurchasesMonth,
      totalProducts: products.length,
      lowStockCount: lowStock.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      receivables,
      payables,
    },
    recentSales: salesInvoices.slice(0, 5),
    salesByDay,
    topProducts,
    categoryBreakdown,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
