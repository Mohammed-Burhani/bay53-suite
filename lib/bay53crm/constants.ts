import type { LeadStage } from "./types";

// ==================== Stage Color Map ====================

export const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; chart: string }> = {
  "Cold Lead": { bg: "bg-blue-100", text: "text-blue-700", chart: "#3b82f6" },
  "Hot Lead": { bg: "bg-amber-100", text: "text-amber-700", chart: "#f59e0b" },
  "Tender": { bg: "bg-purple-100", text: "text-purple-700", chart: "#a855f7" },
  "Tender Won": { bg: "bg-green-100", text: "text-green-700", chart: "#22c55e" },
  "Tender Lost": { bg: "bg-red-100", text: "text-red-700", chart: "#ef4444" },
  "Won": { bg: "bg-emerald-100", text: "text-emerald-700", chart: "#10b981" },
  "Lost": { bg: "bg-gray-100", text: "text-gray-600", chart: "#9ca3af" },
};

// ==================== KPI Colors ====================

export const KPI_COLORS = {
  leads: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  open: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
  won: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
  lost: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
  target: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
  actual: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  task: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
  pending: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  offers: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "text-cyan-500" },
};

// ==================== Master Data Defaults ====================

export const DEFAULT_MASTER_VALUES: Record<string, { name: string; code?: string; color?: string }[]> = {
  region: [
    { name: "LIV - Bengaluru", code: "LIV-BNG" },
    { name: "LIV - Mumbai", code: "LIV-MUM" },
    { name: "LIV - Chennai", code: "LIV-CHN" },
    { name: "LIV - Hyderabad", code: "LIV-HYD" },
    { name: "LIV - Pune", code: "LIV-PUN" },
    { name: "LIV - Delhi", code: "LIV-DEL" },
    { name: "LIV - Kolkata", code: "LIV-KOL" },
    { name: "LIV - Kochi", code: "LIV-KOC" },
  ],
  vertical: [
    { name: "Commercial" },
    { name: "Residential" },
    { name: "Hospitality" },
    { name: "Healthcare" },
    { name: "Education" },
    { name: "Industrial" },
    { name: "Infrastructure" },
    { name: "Data Center" },
  ],
  lead_source: [
    { name: "Reference" },
    { name: "Cold Call" },
    { name: "Website" },
    { name: "Trade Show" },
    { name: "Social Media" },
    { name: "Existing Customer" },
    { name: "Tender Portal" },
    { name: "Consultant" },
  ],
  lead_stage: [
    { name: "Cold Lead", color: "#3b82f6" },
    { name: "Hot Lead", color: "#f59e0b" },
    { name: "Tender", color: "#a855f7" },
    { name: "Tender Won", color: "#22c55e" },
    { name: "Tender Lost", color: "#ef4444" },
    { name: "Won", color: "#10b981" },
    { name: "Lost", color: "#9ca3af" },
  ],
  project_status: [
    { name: "Awarded" },
    { name: "Not Awarded" },
  ],
  brand_approval_discipline: [
    { name: "HVAC" },
    { name: "Plumbing" },
    { name: "Fire Fighting" },
    { name: "Electrical" },
    { name: "BMS" },
    { name: "ELV" },
    { name: "Structural" },
    { name: "Civil" },
  ],
  customer_state: [
    { name: "Karnataka" },
    { name: "Maharashtra" },
    { name: "Tamil Nadu" },
    { name: "Telangana" },
    { name: "Gujarat" },
    { name: "Delhi" },
    { name: "West Bengal" },
    { name: "Kerala" },
    { name: "Rajasthan" },
    { name: "Uttar Pradesh" },
    { name: "Madhya Pradesh" },
    { name: "Punjab" },
  ],
  assigned_to: [
    { name: "Rahul Sharma" },
    { name: "Priya Patel" },
    { name: "Amit Kumar" },
    { name: "Sneha Reddy" },
    { name: "Vikram Singh" },
    { name: "Deepa Nair" },
  ],
};

// ==================== Financial Year Helpers ====================

export function getFinancialYears(): { label: string; value: string; startDate: string; endDate: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = currentYear - 4; // 4 years back
  const endYear = currentYear + 1;   // 1 year forward
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push({
      label: `FY ${String(y).slice(2)}-${String(y + 1).slice(2)}`,
      value: `${y}-${y + 1}`,
      startDate: `${y}-04-01`,
      endDate: `${y + 1}-03-31`,
    });
  }
  return years;
}

export function getCurrentFY(): string {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

// ==================== ID Generator ====================

let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

// ==================== Format Helpers ====================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==================== Probability Map ====================

export const PROBABILITY_MAP: Record<string, number> = {
  "Cold Lead": 10,
  "Hot Lead": 40,
  "Tender": 60,
  "Tender Won": 80,
  "Tender Lost": 0,
  "Won": 100,
  "Lost": 0,
};
