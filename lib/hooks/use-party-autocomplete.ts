import { useQuery } from "@tanstack/react-query";
import { partyAutocompleteService, PartyAutocomplete } from "@/supabase/services/party-autocomplete-service";

export function useSellerAutocomplete(searchQuery?: string) {
  return useQuery<PartyAutocomplete[], Error>({
    queryKey: ['sellers-autocomplete', searchQuery || ''],
    queryFn: () => partyAutocompleteService.getUniqueSellers(searchQuery),
    staleTime: 10 * 60 * 1000, // 10 minutes - data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: searchQuery !== undefined, // Only run when searchQuery is provided
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
}

export function useBuyerAutocomplete(searchQuery?: string) {
  return useQuery<PartyAutocomplete[], Error>({
    queryKey: ['buyers-autocomplete', searchQuery || ''],
    queryFn: () => partyAutocompleteService.getUniqueBuyers(searchQuery),
    staleTime: 10 * 60 * 1000, // 10 minutes - data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    enabled: searchQuery !== undefined, // Only run when searchQuery is provided
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });
}
