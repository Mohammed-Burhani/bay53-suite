import { createClient } from "../client";

export interface PartyAutocomplete {
  name: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  count: number; // How many times this party appears in invoices
}

// Cache user ID to avoid repeated auth calls
let cachedUserId: string | null = null;
let userIdPromise: Promise<string> | null = null;

async function getUserId(): Promise<string> {
  // Return cached user ID if available
  if (cachedUserId) {
    return cachedUserId;
  }

  // Return existing promise if already fetching
  if (userIdPromise) {
    return userIdPromise;
  }

  // Create new promise to fetch user ID
  userIdPromise = (async () => {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      userIdPromise = null; // Reset promise on error
      throw new Error('User not authenticated');
    }
    
    cachedUserId = user.id;
    userIdPromise = null; // Clear promise after success
    return user.id;
  })();

  return userIdPromise;
}

export const partyAutocompleteService = {
  // Get unique sellers from previous invoices
  async getUniqueSellers(searchQuery?: string): Promise<PartyAutocomplete[]> {
    const supabase = createClient();
    const userId = await getUserId();
    
    let query = supabase
      .from('invoices')
      .select('seller_name, seller_gstin, seller_address, seller_city, seller_state, seller_pincode, seller_phone, seller_email')
      .eq('user_id', userId)
      .not('seller_name', 'is', null);
    
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.trim();
      query = query.or(`seller_name.ilike.%${search}%,seller_gstin.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by seller details and count occurrences
    const sellerMap = new Map<string, PartyAutocomplete>();
    
    data?.forEach((invoice) => {
      // Create a unique key based on name and GSTIN
      const key = `${invoice.seller_name.toLowerCase()}-${invoice.seller_gstin || 'no-gstin'}`;
      
      if (sellerMap.has(key)) {
        const existing = sellerMap.get(key)!;
        existing.count += 1;
      } else {
        sellerMap.set(key, {
          name: invoice.seller_name,
          gstin: invoice.seller_gstin || undefined,
          address: invoice.seller_address || undefined,
          city: invoice.seller_city || undefined,
          state: invoice.seller_state || undefined,
          pincode: invoice.seller_pincode || undefined,
          phone: invoice.seller_phone || undefined,
          email: invoice.seller_email || undefined,
          count: 1,
        });
      }
    });
    
    // Convert to array and sort by count (most used first)
    return Array.from(sellerMap.values()).sort((a, b) => b.count - a.count);
  },

  // Get unique buyers from previous invoices
  async getUniqueBuyers(searchQuery?: string): Promise<PartyAutocomplete[]> {
    const supabase = createClient();
    const userId = await getUserId();
    
    let query = supabase
      .from('invoices')
      .select('buyer_name, buyer_gstin, buyer_address, buyer_city, buyer_state, buyer_pincode, buyer_phone, buyer_email')
      .eq('user_id', userId)
      .not('buyer_name', 'is', null);
    
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.trim();
      query = query.or(`buyer_name.ilike.%${search}%,buyer_gstin.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by buyer details and count occurrences
    const buyerMap = new Map<string, PartyAutocomplete>();
    
    data?.forEach((invoice) => {
      // Create a unique key based on name and GSTIN
      const key = `${invoice.buyer_name.toLowerCase()}-${invoice.buyer_gstin || 'no-gstin'}`;
      
      if (buyerMap.has(key)) {
        const existing = buyerMap.get(key)!;
        existing.count += 1;
      } else {
        buyerMap.set(key, {
          name: invoice.buyer_name,
          gstin: invoice.buyer_gstin || undefined,
          address: invoice.buyer_address || undefined,
          city: invoice.buyer_city || undefined,
          state: invoice.buyer_state || undefined,
          pincode: invoice.buyer_pincode || undefined,
          phone: invoice.buyer_phone || undefined,
          email: invoice.buyer_email || undefined,
          count: 1,
        });
      }
    });
    
    // Convert to array and sort by count (most used first)
    return Array.from(buyerMap.values()).sort((a, b) => b.count - a.count);
  },
};
