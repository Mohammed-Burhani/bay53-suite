"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectCheckboxProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelectCheckbox({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectCheckboxProps) {
  const [open, setOpen] = useState(false);

  const allSelected = options.length > 0 && selected.length === options.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  };

  const toggleItem = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between h-auto min-h-9", className)}
        >
          <div className="flex gap-1 flex-wrap flex-1">
            {selected.length > 0 ? (
              selected.slice(0, 2).map((val) => {
                const opt = options.find((o) => o.value === val);
                return (
                  <Badge key={val} variant="secondary" className="mr-1">
                    {opt?.label}
                    <button
                      className="ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem(val);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.length > 2 && (
              <Badge variant="secondary">+{selected.length - 2} more</Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="space-y-1">
          {/* --All-- toggle */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer" onClick={toggleAll}>
            <Checkbox checked={allSelected} className={someSelected ? "data-[state=checked]:bg-primary/50" : ""} />
            <span className="text-sm font-medium">--All--</span>
          </div>
          <div className="h-px bg-border my-1" />
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
              onClick={() => toggleItem(option.value)}
            >
              <Checkbox checked={selected.includes(option.value)} />
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
          {selected.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={clearAll}>
                Clear All
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
