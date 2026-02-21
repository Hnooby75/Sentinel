// ============================================
// app/api/marketing/campagnes/route.ts
// GET: campagnes de l'entreprise
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()

  const { data: campagnes, error } = await db
    .from('campagnes_marketing')
    .select('id, nom, type, statut, objectif, budget, plateforme, date_debut, date_fin')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campagnes: campagnes || [] })
}
