// ============================================
// app/api/admin/sav/route.ts
// GET: toutes les conversations SAV (admin)
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
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const db = createAdminClient()

  // Récupérer toutes les entreprises avec nb messages non lus
  const { data: entreprises } = await db
    .from('entreprises')
    .select('id, nom, plan')
    .order('nom', { ascending: true })

  if (!entreprises) return NextResponse.json({ conversations: [] })

  // Compter les messages non lus par entreprise
  const { data: nonLus } = await db
    .from('messages_sav')
    .select('entreprise_id')
    .eq('is_from_support', false)
    .eq('lu', false)

  const nonLusMap: Record<string, number> = {}
  ;(nonLus || []).forEach(m => {
    nonLusMap[m.entreprise_id] = (nonLusMap[m.entreprise_id] || 0) + 1
  })

  // Dernier message par entreprise
  const { data: derniers } = await db
    .from('messages_sav')
    .select('entreprise_id, content, created_at, is_from_support')
    .order('created_at', { ascending: false })

  const derniersMap: Record<string, { content: string; created_at: string; is_from_support: boolean }> = {}
  ;(derniers || []).forEach(m => {
    if (!derniersMap[m.entreprise_id]) {
      derniersMap[m.entreprise_id] = {
        content: m.content,
        created_at: m.created_at,
        is_from_support: m.is_from_support,
      }
    }
  })

  const conversations = entreprises.map(e => ({
    entreprise_id: e.id,
    nom: e.nom,
    plan: e.plan,
    non_lus: nonLusMap[e.id] || 0,
    dernier_message: derniersMap[e.id] || null,
  }))

  return NextResponse.json({ conversations })
}
