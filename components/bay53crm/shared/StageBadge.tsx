"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStage } from "@/lib/bay53crm/types";
import { STAGE_COLORS } from "@/lib/bay53crm/constants";
import { stageColors } from "@/lib/bay53crm/leads";

interface StageBadgeProps {
  /** A mock-data stage (LeadStage) or a stage label from the CRM API. */
  stage: LeadStage | string;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const colors = STAGE_COLORS[stage as LeadStage] ?? stageColors(stage) ?? { bg: "bg-gray-100", text: "text-gray-600" };

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
