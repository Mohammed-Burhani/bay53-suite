"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { encodeCode128 } from "@/lib/utils/barcode";

interface BarcodeLabelProps {
  /** The barcode value to render (Code 128). */
  value: string;
  /** Optional product name shown above the bars. */
  productName?: string;
  /** Optional pre-formatted price string shown below (e.g. "₹599.00"). */
  priceText?: string;
  /** Label shown before the price (default "MRP"). */
  priceLabel?: string;
  /** Bar height in px (default 56). */
  barHeight?: number;
  /** Module (thinnest bar) width in px (default 2). */
  moduleWidth?: number;
  /** Quiet zone in modules on each side (default 10 per spec). */
  quietZone?: number;
  /** Show the human-readable value below the bars (default true). */
  showValue?: boolean;
  showName?: boolean;
  showPrice?: boolean;
  className?: string;
}

/**
 * Renders a Code 128 barcode as crisp SVG (reactive to `value`). Used both for
 * the in-app preview and label cards. Falls back to a placeholder when the value
 * is empty or cannot be encoded.
 */
export function BarcodeLabel({
  value,
  productName,
  priceText,
  priceLabel = "MRP",
  barHeight = 56,
  moduleWidth = 2,
  quietZone = 10,
  showValue = true,
  showName = true,
  showPrice = true,
  className,
}: BarcodeLabelProps) {
  const encoded = useMemo(() => {
    try {
      return encodeCode128(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!value || !encoded || encoded.bars.length === 0) {
    return (
      <div
        className={cn(
          "flex h-24 w-full items-center justify-center rounded-md border border-dashed bg-muted/30 px-3 text-center text-xs text-muted-foreground",
          className
        )}
      >
        {value ? "This value can't be encoded as a barcode" : "No barcode to preview"}
      </div>
    );
  }

  const fontSize = 13;
  const textGap = 4;
  const textHeight = showValue ? fontSize + textGap : 0;
  const totalModules = encoded.width + quietZone * 2;
  const svgWidth = totalModules * moduleWidth;
  const svgHeight = barHeight + textHeight;

  return (
    <div className={cn("inline-flex max-w-full flex-col items-center gap-1 rounded-md bg-white p-2", className)}>
      {showName && productName ? (
        <div className="max-w-full truncate text-center text-xs font-semibold text-black">{productName}</div>
      ) : null}

      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: svgWidth }}
      >
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#ffffff" />
        {encoded.bars.map((bar, i) => (
          <rect
            key={i}
            x={(bar.x + quietZone) * moduleWidth}
            y={0}
            width={bar.width * moduleWidth}
            height={barHeight}
            fill="#000000"
          />
        ))}
        {showValue ? (
          <text
            x={svgWidth / 2}
            y={barHeight + fontSize}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize={fontSize}
            letterSpacing="1"
            fill="#000000"
          >
            {value}
          </text>
        ) : null}
      </svg>

      {showPrice && priceText ? (
        <div className="text-sm font-bold text-black">
          {priceLabel}: {priceText}
        </div>
      ) : null}
    </div>
  );
}
