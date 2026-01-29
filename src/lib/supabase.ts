import { createClient } from '@supabase/supabase-js'
// import type { Database } from '@/types/database' // Uncomment when you generate types from Supabase

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Browser client for client components
 * Use this in 'use client' components
 * 
 * Example:
 * ```ts
 * 'use client'
 * import { createBrowserClient } from '@/src/lib/supabase'
 * const supabase = createBrowserClient()
 * ```
 */
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Default client export (browser client)
 * For backward compatibility and simple usage
 * 
 * Example:
 * ```ts
 * 'use client'
 * import { supabase } from '@/src/lib/supabase'
 * ```
 */
export const supabase = createBrowserClient()

/**
 * Server-side client (for API routes, Server Actions, etc.)
 * Note: For App Router Server Components, consider using @supabase/ssr instead
 * 
 * Example:
 * ```ts
 * import { createServerClient } from '@/src/lib/supabase'
 * const supabase = createServerClient()
 * ```
 */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
