import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

// Validate URL format
if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  console.warn(
    `Warning: Supabase URL format looks incorrect: ${supabaseUrl}. Expected format: https://[project-ref].supabase.co`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using custom auth
  },
});
