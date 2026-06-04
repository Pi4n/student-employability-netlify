/**
 * Shared Supabase client for all Netlify Functions.
 *
 * Reads from env vars:
 *   SUPABASE_URL                – your project URL (https://<ref>.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY   – service-role key (bypasses RLS; server only)
 *
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser. It is only used here,
 * inside Netlify serverless functions, which run server-side.
 */

const { createClient } = require('@supabase/supabase-js');

let supabase;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        'Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' }
    });
  }
  return supabase;
}

module.exports = { getSupabase };
