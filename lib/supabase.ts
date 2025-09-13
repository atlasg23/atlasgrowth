import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations with full access
export const supabaseAdmin = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback to regular client on client-side