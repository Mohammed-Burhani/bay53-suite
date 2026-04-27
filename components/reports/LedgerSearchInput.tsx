"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Loader2, X, Check, ChevronsUpDown } from "lucide-react";
import { useLedgersByGroup } from "@/lib/hooks/useReports";
import type { Ledger } from "@/lib/types/reports.types";
import { cn } from "@/lib/utils";

interface LedgerSearchInputProps {
  selectedLedgerIds: number[];
  onLedgerIdsChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  groups?: number[] | null;
  multiSelect?: boolean;
  onLedgerNameChange?: (name: string) => void;
  selectedLedgers?: Array<{ ledger_id: number; name: string; group: string | null }>;
  onSelectedLedgersChange?: (ledgers: Array<{ ledger_id: number; name: string; group: string | null }>) => void;
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
  selectedLedgers: externalSelectedLedgers,
  onSelectedLedgersChange,
}: LedgerSearchInputProps) {
  const [ledgerSearchOpen, setLedgerSearchOpen] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  
  // Derive selectedLedgersMap from externalSelectedLedgers
  const selectedLedgersMap = useMemo(() => {
    const map = new Map<number, Ledger>();
    if (externalSelectedLedgers && Array.isArray(externalSelectedLedgers)) {
      externalSelectedLedgers.forEach(ledger => {
        map.set(ledger.ledger_id, ledger as Ledger);
      });
    }
    return map;
  }, [externalSelectedLedgers]);

  // Fetch all ledgers once based on groups
  // If groups is null, fetch all ledgers; if groups is an array, filter by those groups
  const { data: allLedgers = [], isLoading: ledgersLoading } = useLedgersByGroup(
    groups === null ? undefined : (groups && groups.length > 0 ? groups : undefined)
  );
  
  // Filter ledgers on frontend - search anywhere in the name (case-insensitive)
  const searchResults = useMemo(() => {
    if (ledgerSearchTerm.length < 3) return [];
    const searchLower = ledgerSearchTerm.toLowerCase();
    return allLedgers.filter(ledger => 
      ledger.name.toLowerCase().includes(searchLower)
    );
  }, [allLedgers, ledgerSearchTerm]);

  const handleLedgerSelect = (ledger: Ledger) => {
    if (multiSelect) {
      if (selectedLedgerIds.includes(ledger.ledger_id)) {
        const newIds = selectedLedgerIds.filter((id) => id !== ledger.ledger_id);
        const newMap = new Map(selectedLedgersMap);
        newMap.delete(ledger.ledger_id);
        
        onLedgerIdsChange(newIds);
        
        if (onSelectedLedgersChange) {
          onSelectedLedgersChange(Array.from(newMap.values()).map(l => ({
            ledger_id: l.ledger_id,
            name: l.name,
            group: l.group
          })));
        }
      } else {
        const newIds = [...selectedLedgerIds, ledger.ledger_id];
        const newMap = new Map(selectedLedgersMap).set(ledger.ledger_id, ledger);
        
        onLedgerIdsChange(newIds);
        
        if (onSelectedLedgersChange) {
          onSelectedLedgersChange(Array.from(newMap.values()).map(l => ({
            ledger_id: l.ledger_id,
            name: l.name,
            group: l.group
          })));
        }
      }
    } else {
      onLedgerIdsChange([ledger.ledger_id]);
      
      if (onLedgerNameChange) {
        onLedgerNameChange(ledger.name);
      }
      if (onSelectedLedgersChange) {
        onSelectedLedgersChange([{
          ledger_id: ledger.ledger_id,
          name: ledger.name,
          group: ledger.group
        }]);
      }
      setLedgerSearchOpen(false);
    }
  };

  const removeLedgerById = (ledgerId: number) => {
    const newIds = selectedLedgerIds.filter((id) => id !== ledgerId);
    
    onLedgerIdsChange(newIds);
    
    if (onSelectedLedgersChange) {
      const newMap = new Map(selectedLedgersMap);
      newMap.delete(ledgerId);
      onSelectedLedgersChange(Array.from(newMap.values()).map(l => ({
        ledger_id: l.ledger_id,
        name: l.name,
        group: l.group
      })));
    }
    
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
              placeholder="Type to search ledgers (min 3 chars)..."
              value={ledgerSearchTerm}
              onValueChange={setLedgerSearchTerm}
            />
            <CommandList>
              {ledgersLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading ledgers...
                </div>
              ) : ledgerSearchTerm.length < 3 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Type at least 3 characters to search
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
              className="text-xs gap-1 pr-1"
            >
              <span>{ledger.name}</span>
              <button
                type="button"
                className="ml-1 rounded-sm hover:bg-destructive/20 hover:text-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeLedgerById(ledger.ledger_id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
