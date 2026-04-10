import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — never import this in client components.
 * Use only in server components, route handlers, and server actions.
 */
export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
