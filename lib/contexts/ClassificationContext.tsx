"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useSession } from "@/lib/hooks/useAuth";
import { useClassificationConfig } from "@/lib/hooks/useProductClassification";
import {
  ClassificationLabels,
  getSavedLabels,
  saveLabels,
  getDefaultLabels,
} from "@/lib/product-classification-storage";

interface ClassificationContextType {
  labels: ClassificationLabels;
  isLoading: boolean;
  getLabel: (fieldId: keyof ClassificationLabels) => string;
}

const DEFAULT_LABELS = getDefaultLabels();

const ClassificationContext = createContext<ClassificationContextType>({
  labels: DEFAULT_LABELS,
  isLoading: false,
  getLabel: (fieldId) => DEFAULT_LABELS[fieldId],
});

const ALLOWED_FIELDS = ['item_code', 'item', 'aliases', 'category', 'sub_cat', 'size', 'ref_no', 'color'] as const;

export function ClassificationProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const organizationId = session?.company?.id?.toString();

  // Initialize from localStorage immediately (no flash of default labels)
  const [labels, setLabels] = useState<ClassificationLabels>(() => {
    return getSavedLabels() || DEFAULT_LABELS;
  });

  const { data: config, isLoading } = useClassificationConfig(organizationId || "");

  // When API data arrives, update labels + persist to localStorage
  useEffect(() => {
    if (!config?.fields?.length) return;

    const newLabels: ClassificationLabels = { ...DEFAULT_LABELS };

    config.fields
      .filter(field => ALLOWED_FIELDS.includes(field.field_id as typeof ALLOWED_FIELDS[number]))
      .forEach(field => {
        if (field.field_id in newLabels) {
          newLabels[field.field_id as keyof ClassificationLabels] = field.field_name;
        }
      });

    setLabels(newLabels);
    saveLabels(newLabels);
  }, [config]);

  // Listen to localStorage changes (cross-tab sync + same-tab custom event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "Bay53_classification_labels" && e.newValue) {
        try {
          const newLabels = JSON.parse(e.newValue) as ClassificationLabels;
          setLabels(newLabels);
        } catch (err) {
          console.error("Failed to parse classification labels from storage event", err);
        }
      }
    };

    // Same-tab update event dispatched after save
    const handleLabelsUpdated = () => {
      const saved = getSavedLabels();
      if (saved) setLabels(saved);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("classification-labels-updated", handleLabelsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("classification-labels-updated", handleLabelsUpdated);
    };
  }, []);

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

// Re-export type for use in other files
export type { ClassificationLabels };
