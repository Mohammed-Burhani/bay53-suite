"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "@/lib/hooks/useAuth";
import { useClassificationConfig } from "@/lib/hooks/useProductClassification";

interface ClassificationLabels {
  item_code: string;
  item: string;
  aliases: string;
  category: string;
  sub_cat: string;
  size: string;
  ref_no: string;
  color: string;
}

interface ClassificationContextType {
  labels: ClassificationLabels;
  isLoading: boolean;
  getLabel: (fieldId: keyof ClassificationLabels) => string;
}

const DEFAULT_LABELS: ClassificationLabels = {
  item_code: "Item Code",
  item: "Item",
  aliases: "Aliases",
  category: "Category",
  sub_cat: "Sub Cat",
  size: "Size",
  ref_no: "Ref No.",
  color: "Color",
};

const ClassificationContext = createContext<ClassificationContextType>({
  labels: DEFAULT_LABELS,
  isLoading: false,
  getLabel: (fieldId) => DEFAULT_LABELS[fieldId],
});

export function ClassificationProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const organizationId = session?.company?.id?.toString() || "demo-org";
  
  const { data: config, isLoading } = useClassificationConfig(organizationId);

  // Build labels map from config (filter to allowed 8 fields only)
  const ALLOWED_FIELDS = ['item_code', 'item', 'aliases', 'category', 'sub_cat', 'size', 'ref_no', 'color'];
  const labels: ClassificationLabels = config?.fields
    .filter(field => ALLOWED_FIELDS.includes(field.field_id))
    .reduce((acc, field) => {
      if (field.field_id in DEFAULT_LABELS) {
        acc[field.field_id as keyof ClassificationLabels] = field.field_name;
      }
      return acc;
    }, { ...DEFAULT_LABELS }) || DEFAULT_LABELS;

  const getLabel = (fieldId: keyof ClassificationLabels) => {
    return labels[fieldId] || DEFAULT_LABELS[fieldId];
  };

  return (
    <ClassificationContext.Provider value={{ labels, isLoading, getLabel }}>
      {children}
    </ClassificationContext.Provider>
  );
}

export function useClassificationLabels() {
  const context = useContext(ClassificationContext);
  if (!context) {
    throw new Error("useClassificationLabels must be used within ClassificationProvider");
  }
  return context;
}
