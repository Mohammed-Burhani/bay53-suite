import { create } from "zustand";
import {
  SEED_ENQUIRIES,
  SEED_QUOTATIONS,
  nextDocNo,
  type CRMEnquiry,
  type CRMQuotation,
} from "../bay53crm/sales-docs";

interface CRMSalesDocsState {
  enquiries: CRMEnquiry[];
  addEnquiry: (data: Omit<CRMEnquiry, "id" | "enquiryNo">) => CRMEnquiry;
  updateEnquiry: (id: string, data: Partial<CRMEnquiry>) => void;
  deleteEnquiry: (id: string) => void;

  quotations: CRMQuotation[];
  addQuotation: (data: Omit<CRMQuotation, "id" | "quotationNo">) => CRMQuotation;
  updateQuotation: (id: string, data: Partial<CRMQuotation>) => void;
  deleteQuotation: (id: string) => void;
}

// Demo-only in-memory store (resets on reload)
export const useCRMSalesDocsStore = create<CRMSalesDocsState>((set, get) => ({
  enquiries: SEED_ENQUIRIES,
  addEnquiry: (data) => {
    const enquiry: CRMEnquiry = {
      ...data,
      id: `enq_${Date.now()}`,
      enquiryNo: nextDocNo("ENQ", get().enquiries.map((e) => e.enquiryNo)),
    };
    set((s) => ({ enquiries: [enquiry, ...s.enquiries] }));
    return enquiry;
  },
  updateEnquiry: (id, data) =>
    set((s) => ({ enquiries: s.enquiries.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
  deleteEnquiry: (id) => set((s) => ({ enquiries: s.enquiries.filter((e) => e.id !== id) })),

  quotations: SEED_QUOTATIONS,
  addQuotation: (data) => {
    const quotation: CRMQuotation = {
      ...data,
      id: `qt_${Date.now()}`,
      quotationNo: nextDocNo("QT", get().quotations.map((q) => q.quotationNo)),
    };
    set((s) => ({ quotations: [quotation, ...s.quotations] }));
    return quotation;
  },
  updateQuotation: (id, data) =>
    set((s) => ({ quotations: s.quotations.map((q) => (q.id === id ? { ...q, ...data } : q)) })),
  deleteQuotation: (id) => set((s) => ({ quotations: s.quotations.filter((q) => q.id !== id) })),
}));
