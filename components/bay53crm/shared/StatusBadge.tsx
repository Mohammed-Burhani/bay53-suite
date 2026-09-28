"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  label: string;
  colors?: { bg: string; text: string };
  className?: string;
}

export function StatusBadge({ label, colors, className }: StatusBadgeProps) {
  const c = colors || { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium text-xs whitespace-nowrap", c.bg, c.text, className)}
    >
      {label}
    </Badge>
  );
}
