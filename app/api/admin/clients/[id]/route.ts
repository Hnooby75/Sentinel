// ============================================
// app/api/admin/clients/[id]/route.ts
// Super admin : détails + modification + suppression d'un client
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const utilisateur = await getUtilisateur(user.id)
  if (utilisateur?.role !== 'super_admin') return null
  return utilisateur
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  const db = createAdminClient()

  const [entrepriseRes, utilisateursRes, siteRes, journauxRes] = await Promise.all([
    db.from('entreprises').select('*').eq('id', id).single(),
    db.from('utilisateurs').select('id, email, prenom, nom, role, actif, created_at').eq('entreprise_id', id),
    db.from('sites_clients').select('*').eq('entreprise_id', id).maybeSingle(),
    db.from('journaux_usage_ia')
      .select('action, created_at')
      .eq('entreprise_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    entreprise:  entrepriseRes.data,
    utilisateurs: utilisateursRes.data || [],
    site:        siteRes.data,
    activite_recente: journauxRes.data || [],
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const db = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (body.plan             !== undefined) updates.plan             = body.plan
  if (body.plan_actif       !== undefined) updates.plan_actif       = body.plan_actif
  if (body.nom              !== undefined) updates.nom              = body.nom
  if (body.trial_expires_at !== undefined) updates.trial_expires_at = body.trial_expires_at
  if (body.site_web_actif   !== undefined) updates.site_web_actif   = body.site_web_actif

  // Extension trial : +30 jours depuis maintenant (ou depuis expiry si dans le futur)
  if (body.extend_trial) {
    const { data: current } = await db.from('entreprises').select('trial_expires_at').eq('id', id).single()
    const base = current?.trial_expires_at && new Date(current.trial_expires_at) > new Date()
      ? new Date(current.trial_expires_at)
      : new Date()
    base.setDate(base.getDate() + 30)
    updates.trial_expires_at = base.toISOString()
    updates.plan = 'trial'
  }

  const { error } = await db.from('entreprises').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gestion du site web client
  if (body.site_contenu !== undefined || body.site_url !== undefined || body.site_statut !== undefined) {
    const siteUpdates: Record<string, unknown> = {
      entreprise_id: id,
      updated_at: new Date().toISOString(),
    }
    if (body.site_contenu !== undefined) siteUpdates.contenu = body.site_contenu
    if (body.site_url !== undefined) siteUpdates.url = body.site_url || null
    if (body.site_statut !== undefined) siteUpdates.statut = body.site_statut

    const { error: siteError } = await db
      .from('sites_clients')
      .upsert(siteUpdates, { onConflict: 'entreprise_id' })
    
    if (siteError) return NextResponse.json({ error: `Erreur site: ${siteError.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, updates })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { id } = await params
  const db = createAdminClient()

  // Supprimer dans l'ordre (contraintes FK) — la plupart ont ON DELETE CASCADE
  // mais on nettoie explicitement pour éviter les erreurs
  await Promise.all([
    db.from('sites_clients').delete().eq('entreprise_id', id),
    db.from('journaux_usage_ia').delete().eq('entreprise_id', id),
  ])

  // Supprimer les utilisateurs liés
  await db.from('utilisateurs').delete().eq('entreprise_id', id)

  // Supprimer l'entreprise
  const { error } = await db.from('entreprises').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
