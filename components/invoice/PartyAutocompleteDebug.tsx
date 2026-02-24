"use client";

import { useSellerAutocomplete, useBuyerAutocomplete } from "@/lib/hooks/use-party-autocomplete";

export function PartyAutocompleteDebug() {
  const { data: sellers, isLoading: loadingSellers, error: errorSellers } = useSellerAutocomplete('');
  const { data: buyers, isLoading: loadingBuyers, error: errorBuyers } = useBuyerAutocomplete('');

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-bold">Autocomplete Debug</h3>
      
      <div>
        <h4 className="font-semibold">Sellers:</h4>
        {loadingSellers && <p>Loading sellers...</p>}
        {errorSellers && <p className="text-red-500">Error: {errorSellers.message}</p>}
        {sellers && (
          <div>
            <p>Found {sellers.length} sellers</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(sellers, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold">Buyers:</h4>
        {loadingBuyers && <p>Loading buyers...</p>}
        {errorBuyers && <p className="text-red-500">Error: {errorBuyers.message}</p>}
        {buyers && (
          <div>
            <p>Found {buyers.length} buyers</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(buyers, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
