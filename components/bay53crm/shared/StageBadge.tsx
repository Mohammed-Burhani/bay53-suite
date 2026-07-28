"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStage } from "@/lib/bay53crm/types";
import { STAGE_COLORS } from "@/lib/bay53crm/constants";

interface StageBadgeProps {
  stage: LeadStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const colors = STAGE_COLORS[stage] || { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium text-xs whitespace-nowrap",
        colors.bg,
        colors.text,
        className
      )}
    >
      {stage}
    </Badge>
  );
}
