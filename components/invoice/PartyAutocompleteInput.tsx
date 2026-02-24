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
import { Input } from "@/components/ui/input";
import { PartyAutocomplete } from "@/supabase/services/party-autocomplete-service";
import { useSellerAutocomplete, useBuyerAutocomplete } from "@/lib/hooks/use-party-autocomplete";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface PartyAutocompleteInputProps {
  type: 'seller' | 'buyer';
  value: string;
  onChange: (value: string) => void;
  onPartySelect?: (party: PartyAutocomplete) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PartyAutocompleteInput({
  type,
  value,
  onChange,
  onPartySelect,
  placeholder = "Enter name...",
  className,
  disabled = false,
}: PartyAutocompleteInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // Use custom debounce hook - 600ms delay
  const debouncedSearch = useDebounce(searchQuery, 600);

  // Sync external value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions based on type - only when popover is open AND we have a debounced search
  const shouldFetchSellers = type === 'seller' && open;
  const shouldFetchBuyers = type === 'buyer' && open;

  const { data: sellers, isLoading: isLoadingSellers, error: sellersError } = useSellerAutocomplete(
    shouldFetchSellers ? debouncedSearch : undefined
  );
  
  const { data: buyers, isLoading: isLoadingBuyers, error: buyersError } = useBuyerAutocomplete(
    shouldFetchBuyers ? debouncedSearch : undefined
  );

  const suggestions = type === 'seller' ? sellers : buyers;
  const isLoading = type === 'seller' ? isLoadingSellers : isLoadingBuyers;
  const error = type === 'seller' ? sellersError : buyersError;

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setSearchQuery(newValue);
    
    // Open popover when user types
    if (!open) {
      setOpen(true);
    }
  };

  const handleSelectParty = (party: PartyAutocomplete) => {
    setInputValue(party.name);
    onChange(party.name);
    setOpen(false);
    setSearchQuery("");
    
    // Notify parent component with full party details
    if (onPartySelect) {
      onPartySelect(party);
    }
  };

  const handleInputFocus = () => {
    // Always open on focus to show suggestions
    setSearchQuery(inputValue);
    setOpen(true);
  };

  const handleButtonClick = () => {
    setSearchQuery(inputValue);
    setOpen(!open);
  };

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number>(400);

  React.useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, []);

  return (
    <div className="relative" ref={triggerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={cn("pr-10", className)}
            disabled={disabled}
          />
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              disabled={disabled}
              type="button"
              onClick={handleButtonClick}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent 
          className="p-0" 
          align="start"
          style={{ width: `${popoverWidth}px` }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${type === 'seller' ? 'sellers' : 'buyers'}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-6 text-sm text-destructive">
                  Error loading suggestions: {error.message}
                </div>
              ) : suggestions && suggestions.length > 0 ? (
                <CommandGroup heading={`Recent ${type === 'seller' ? 'Sellers' : 'Buyers'}`}>
                  {suggestions.map((party, index) => (
                    <CommandItem
                      key={`${party.name}-${party.gstin || index}`}
                      value={party.name}
                      onSelect={() => handleSelectParty(party)}
                      className="flex flex-col items-start py-3"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            inputValue === party.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{party.name}</div>
                          {party.gstin && (
                            <div className="text-xs text-muted-foreground">
                              GSTIN: {party.gstin}
                            </div>
                          )}
                          {party.city && party.state && (
                            <div className="text-xs text-muted-foreground">
                              {party.city}, {party.state}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground ml-2">
                          {party.count} {party.count === 1 ? 'time' : 'times'}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    {debouncedSearch ? (
                      <p className="text-muted-foreground">No matching records found.</p>
                    ) : suggestions && suggestions.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">No previous {type === 'seller' ? 'sellers' : 'buyers'} found.</p>
                        <p className="text-xs text-muted-foreground">
                          Create your first invoice to see suggestions here.
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Start typing to search...</p>
                    )}
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
