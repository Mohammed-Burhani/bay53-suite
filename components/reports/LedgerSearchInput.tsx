"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Loader2, X, Check, ChevronsUpDown } from "lucide-react";
import { useLedgerSearch } from "@/lib/hooks/useReports";
import type { Ledger } from "@/lib/types/reports.types";
import { cn } from "@/lib/utils";

interface LedgerSearchInputProps {
  selectedLedgerIds: number[];
  onLedgerIdsChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  groups?: number[];
  multiSelect?: boolean;
  onLedgerNameChange?: (name: string) => void;
}

export function LedgerSearchInput({
  selectedLedgerIds,
  onLedgerIdsChange,
  label = "Ledgers",
  placeholder = "Search and select ledgers...",
  required = false,
  className = "",
  groups,
  multiSelect = true,
  onLedgerNameChange,
}: LedgerSearchInputProps) {
  const [ledgerSearchOpen, setLedgerSearchOpen] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedLedgersMap, setSelectedLedgersMap] = useState<Map<number, Ledger>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(ledgerSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [ledgerSearchTerm]);

  const { data: searchResults = [], isLoading: ledgersLoading } = useLedgerSearch(
    debouncedSearchTerm,
    groups
  );

  const handleLedgerSelect = (ledger: Ledger) => {
    if (multiSelect) {
      if (selectedLedgerIds.includes(ledger.ledger_id)) {
        const newIds = selectedLedgerIds.filter((id) => id !== ledger.ledger_id);
        onLedgerIdsChange(newIds);
        setSelectedLedgersMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(ledger.ledger_id);
          return newMap;
        });
      } else {
        onLedgerIdsChange([...selectedLedgerIds, ledger.ledger_id]);
        setSelectedLedgersMap((prev) => new Map(prev).set(ledger.ledger_id, ledger));
      }
    } else {
      onLedgerIdsChange([ledger.ledger_id]);
      setSelectedLedgersMap(new Map([[ledger.ledger_id, ledger]]));
      if (onLedgerNameChange) {
        onLedgerNameChange(ledger.name);
      }
      setLedgerSearchOpen(false);
    }
  };

  const removeLedgerById = (ledgerId: number) => {
    const newIds = selectedLedgerIds.filter((id) => id !== ledgerId);
    onLedgerIdsChange(newIds);
    setSelectedLedgersMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(ledgerId);
      return newMap;
    });
    if (!multiSelect && onLedgerNameChange) {
      onLedgerNameChange("");
    }
  };

  const selectedLedgers = Array.from(selectedLedgersMap.values());
  const selectedLedger = selectedLedgers[0];

  const groupedLedgers = searchResults.reduce((acc, ledger) => {
    const groupName = ledger.group || "Ungrouped";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(ledger);
    return acc;
  }, {} as Record<string, Ledger[]>);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={ledgerSearchOpen} onOpenChange={setLedgerSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={ledgerSearchOpen}
            className="w-full h-9 justify-between font-normal"
          >
            {selectedLedgerIds.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : multiSelect ? (
              <span className="truncate">
                {selectedLedgerIds.length} ledger{selectedLedgerIds.length > 1 ? "s" : ""} selected
              </span>
            ) : (
              <span className="truncate">{selectedLedger?.name || placeholder}</span>
            )}
            {multiSelect ? (
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search ledgers (min 2 chars)..."
              value={ledgerSearchTerm}
              onValueChange={setLedgerSearchTerm}
            />
            <CommandList>
              {ledgerSearchTerm.length < 2 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              ) : ledgersLoading || ledgerSearchTerm !== debouncedSearchTerm ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : Object.keys(groupedLedgers).length === 0 ? (
                <CommandEmpty>No ledgers found.</CommandEmpty>
              ) : (
                <div className="max-h-[300px] overflow-auto">
                  {Object.entries(groupedLedgers).map(([groupName, ledgers]) => (
                    <CommandGroup key={groupName} heading={groupName}>
                      {ledgers.map((ledger) => (
                        <CommandItem
                          key={ledger.ledger_id}
                          value={`${ledger.name} ${ledger.ledger_id}`}
                          onSelect={() => handleLedgerSelect(ledger)}
                        >
                          {multiSelect ? (
                            <Checkbox
                              checked={selectedLedgerIds.includes(ledger.ledger_id)}
                              className="mr-2"
                            />
                          ) : (
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLedgerIds.includes(ledger.ledger_id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{ledger.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {ledger.ledger_id} {ledger.group && `• ${ledger.group}`}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {multiSelect && selectedLedgers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLedgers.map((ledger) => (
            <Badge
              key={ledger.ledger_id}
              variant="secondary"
              className="text-xs gap-1"
            >
              {ledger.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeLedgerById(ledger.ledger_id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
