import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — never import this in client components.
 * Use only in server components, route handlers, and server actions.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
