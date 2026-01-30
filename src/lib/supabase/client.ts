import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables")
}

/** Client Components 전용 (브라우저) */
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
}

