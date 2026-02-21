// ============================================
// POST /api/admin/tarifs
// Sauvegarde des tarifs (services ou packs) dans site_settings
// Requiert super_admin
// ============================================
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { cle, valeur } = body

  if (!cle || !valeur) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const CLES_AUTORISEES = ['tarifs_services', 'tarifs_packs']
  if (!CLES_AUTORISEES.includes(cle)) {
    return NextResponse.json({ error: 'Clé non autorisée' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db
    .from('site_settings')
    .upsert({ cle, valeur, updated_at: new Date().toISOString() }, { onConflict: 'cle' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, cle })
}
