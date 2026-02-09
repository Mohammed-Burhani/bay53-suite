// ==================== Core Types ====================

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  gstRate: number; // 0, 5, 12, 18, 28
  hsnCode?: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  name: string;
  type: "customer" | "supplier";
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  balance: number; // positive = they owe us, negative = we owe them
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  gstRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "sale" | "purchase";
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  amountPaid: number;
  paymentMode: "cash" | "upi" | "card" | "bank_transfer" | "credit";
  status: "paid" | "partial" | "unpaid";
  date: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalSalesToday: number;
  totalSalesMonth: number;
  totalPurchasesMonth: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalSuppliers: number;
  receivables: number;
  payables: number;
}

export type ProductCategory =
  | "Electronics"
  | "Clothing & Apparel"
  | "Grocery & FMCG"
  | "Pharmacy & Health"
  | "Hardware & Tools"
  | "Stationery & Office"
  | "Automobile Parts"
  | "Jewellery & Accessories"
  | "Furniture & Home"
  | "Sports & Fitness"
  | "Beauty & Personal Care"
  | "Books & Media"
  | "Toys & Games"
  | "Other";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Electronics",
  "Clothing & Apparel",
  "Grocery & FMCG",
  "Pharmacy & Health",
  "Hardware & Tools",
  "Stationery & Office",
  "Automobile Parts",
  "Jewellery & Accessories",
  "Furniture & Home",
  "Sports & Fitness",
  "Beauty & Personal Care",
  "Books & Media",
  "Toys & Games",
  "Other",
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const UNITS = [
  "Pcs",
  "Kg",
  "Gm",
  "Ltr",
  "Ml",
  "Mtr",
  "Ft",
  "Box",
  "Pack",
  "Dozen",
  "Set",
  "Pair",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];
