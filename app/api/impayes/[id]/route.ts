// ============================================
// app/api/impayes/[id]/route.ts
// Module 2 — Impayés : PATCH/DELETE facture
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const UpdateFactureSchema = z.object({
  statut: z.enum(['brouillon', 'envoyee', 'partielle', 'payee', 'en_retard', 'contentieux']).optional(),
  date_paiement: z.string().optional(),
  notes: z.string().optional(),
  montant_ht: z.number().positive().optional(),
  montant_ttc: z.number().positive().optional(),
  date_echeance: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: facture, error } = await supabase
    .from('factures')
    .select('*, client:clients(id, nom, email, telephone), paiements(*)')
    .eq('id', id)
    .single()

  if (error || !facture) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })

  // Charger les relances séparément (table peut ne pas exister)
  let relances: any[] = []
  try {
    const { data } = await supabase
      .from('relances')
      .select('*')
      .eq('facture_id', id)
      .order('created_at', { ascending: false })
    relances = data || []
  } catch { /* table relances peut ne pas exister */ }

  return NextResponse.json({ ...facture, relances })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // FIX: admin client pour bypasser RLS sur utilisateurs
  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()

  // Relance
  if (body.type === 'relance') {
    const { data: relance, error } = await supabase
      .from('relances')
      .insert({
        facture_id: id,
        entreprise_id: utilisateur.entreprise_id,
        type: body.type_relance || 'amiable',
        notes: body.notes,
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(relance)
  }

  // Paiement partiel
  if (body.type === 'paiement') {
    const { data: paiement, error } = await supabase
      .from('paiements')
      .insert({
        facture_id: id,
        entreprise_id: utilisateur.entreprise_id,
        montant: body.montant,
        date_paiement: body.date_paiement,
        mode: body.mode || 'virement',
        notes: body.reference || null,
      })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Recalculer statut facture après paiement
    const { data: facture } = await admin
      .from('factures')
      .select('montant_ttc')
      .eq('id', id)
      .single()
    const { data: allPaiements } = await admin
      .from('paiements')
      .select('montant')
      .eq('facture_id', id)
    const totalPaye = (allPaiements || []).reduce((acc, p) => acc + Number(p.montant), 0)
    const montantTTC = Number(facture?.montant_ttc || 0)
    const nouveauStatut = totalPaye >= montantTTC ? 'payee' : 'partielle'

    await admin.from('factures').update({
      statut: nouveauStatut,
      ...(nouveauStatut === 'payee' ? { date_paiement: body.date_paiement } : {}),
    }).eq('id', id)

    // Recalculer scores globaux en arrière-plan
    calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
      await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
    }).catch(console.error)

    return NextResponse.json(paiement)
  }

  const validation = UpdateFactureSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { data: avant } = await supabase.from('factures').select('*').eq('id', id).single()
  const { data: facture, error } = await supabase
    .from('factures')
    .update(validation.data)
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    entreprise_id: utilisateur.entreprise_id,
    utilisateur_id: user.id,
    action: 'facture.update',
    ressource_type: 'facture',
    ressource_id: id,
    avant,
    apres: facture,
    succes: true,
  })

  // Recalculer scores si le statut a changé
  if (validation.data.statut && validation.data.statut !== avant?.statut) {
    calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
      await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
    }).catch(console.error)
  }

  return NextResponse.json(facture)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // FIX: admin client pour bypasser RLS sur utilisateurs
  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id, role').eq('id', user.id).single()
  if (!utilisateur || (utilisateur.role !== 'admin' && utilisateur.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { error } = await supabase
    .from('factures')
    .delete()
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
