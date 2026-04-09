"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Item } from "@/lib/types/reports.types";

interface ItemSearchComboboxProps {
  items: Item[];
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
}

export function ItemSearchCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Select item...",
  searchPlaceholder = "Search by code, name, size, brand...",
  emptyText = "No items found.",
  disabled = false,
  className,
  isLoading = false,
}: ItemSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Find selected item
  const selectedItem = items.find((item) => item.item_ID === value);

  // Filter items based on search term - search across all fields
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return items;
    
    const search = searchTerm.toLowerCase();
    return items.filter((item) => {
      return (
        item.item_CodeTxt?.toLowerCase().includes(search) ||
        item.name?.toLowerCase().includes(search) ||
        item.sizes?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.type?.toLowerCase().includes(search) ||
        item.hsnNo?.toLowerCase().includes(search) ||
        item.item_ID.toString().includes(search)
      );
    });
  }, [items, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-9", className)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading items...
            </span>
          ) : selectedItem ? (
            <span className="truncate">
              {selectedItem.item_CodeTxt || selectedItem.name} - {selectedItem.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredItems.slice(0, 100).map((item) => (
                <CommandItem
                  key={item.item_ID}
                  value={item.item_ID.toString()}
                  onSelect={() => {
                    onValueChange(item.item_ID === value ? null : item.item_ID);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === item.item_ID ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {item.name}
                        </span>
                        {item.brand && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.item_CodeTxt && (
                          <span className="font-mono">Code: {item.item_CodeTxt}</span>
                        )}
                        {item.sizes && <span>Size: {item.sizes}</span>}
                        {item.category && <span>Category: {item.category}</span>}
                        {item.type && <span>Type: {item.type}</span>}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
              {filteredItems.length > 100 && (
                <div className="px-2 py-3 text-xs text-center text-muted-foreground border-t">
                  Showing first 100 of {filteredItems.length} items. Refine your search for more.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
