// ============================================
// app/api/admin/vitrine/route.ts
// API ADMIN — lecture et écriture du contenu de la vitrine
// GET  → retourne le contenu actuel
// POST → sauvegarde le contenu (super_admin uniquement)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

async function getSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') return null

  return utilisateur
}

export async function GET() {
  const utilisateur = await getSuperAdmin()
  if (!utilisateur) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const db = createAdminClient()
  const { data: site } = await db
    .from('sites_clients')
    .select('contenu, statut, url, updated_at')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .single()

  return NextResponse.json({ site: site || null })
}

export async function POST(request: NextRequest) {
  const utilisateur = await getSuperAdmin()
  if (!utilisateur) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { contenu } = body

  if (!contenu || typeof contenu !== 'object') {
    return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db
    .from('sites_clients')
    .upsert(
      {
        entreprise_id: utilisateur.entreprise_id,
        contenu,
        url: '/vitrine',
        statut: 'en_ligne',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'entreprise_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
