// ============================================
// lib/supabase/admin.ts
// Client Supabase avec service_role — JAMAIS côté client
// Bypass RLS pour les opérations système (audit logs, score...)
// ============================================
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante — ne jamais exposer côté client')
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  )
}
