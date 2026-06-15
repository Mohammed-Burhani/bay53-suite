import { createBrowserClient } from "@supabase/ssr";

// POS Database (separate instance for multi-tenant e-commerce)
const posSupabaseUrl = process.env.NEXT_PUBLIC_POS_SUPABASE_URL;
const posSupabaseKey = process.env.NEXT_PUBLIC_POS_SUPABASE_KEY;

export const createPOSClient = () => {
  if (!posSupabaseUrl || !posSupabaseKey) {
    throw new Error("POS Supabase credentials not configured");
  }
  
  return createBrowserClient(posSupabaseUrl, posSupabaseKey);
};

// Singleton instance
let posClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const getPOSClient = () => {
  if (!posClientInstance) {
    posClientInstance = createPOSClient();
  }
  return posClientInstance;
};
