// ============================================
// lib/supabase/getUtilisateur.ts
// Lecture du profil utilisateur avec client admin (bypass RLS)
// ============================================
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function getUtilisateur(userId: string): Promise<any> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('utilisateurs')
    .select(`
      id, prenom, nom, role, email, entreprise_id,
      entreprise:entreprises(id, nom, plan, plan_actif, trial_expires_at)
    `)
    .eq('id', userId)
    .single()
  return data
}
