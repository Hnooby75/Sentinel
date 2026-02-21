// ============================================
// app/api/admin/marketing/[entreprise_id]/route.ts
// GET: mission d'une entreprise (détail)
// PATCH: modifier la mission (agent, heures, statut)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entreprise_id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { entreprise_id } = await params
  const db = createAdminClient()

  const [missionRes, campagnesRes, rdvsRes] = await Promise.all([
    db
      .from('marketing_missions')
      .select(`
        *,
        agent:agents_sentinel(*),
        entreprise:entreprises(id, nom, plan)
      `)
      .eq('entreprise_id', entreprise_id)
      .single(),
    db
      .from('campagnes_marketing')
      .select('*')
      .eq('entreprise_id', entreprise_id)
      .order('created_at', { ascending: false }),
    db
      .from('rendez_vous_marketing')
      .select('*')
      .eq('entreprise_id', entreprise_id)
      .order('date_rdv', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    mission: missionRes.data,
    campagnes: campagnesRes.data || [],
    rdvs: rdvsRes.data || [],
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entreprise_id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { entreprise_id } = await params
  const body = await request.json()
  const db = createAdminClient()

  // Créer ou mettre à jour la mission
  const { data: existing } = await db
    .from('marketing_missions')
    .select('id')
    .eq('entreprise_id', entreprise_id)
    .single()

  const updates: Record<string, unknown> = {}
  if (body.agent_id !== undefined) updates.agent_id = body.agent_id
  if (body.heures_allouees_par_mois !== undefined) updates.heures_allouees_par_mois = body.heures_allouees_par_mois
  if (body.statut !== undefined) updates.statut = body.statut
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.date_debut !== undefined) updates.date_debut = body.date_debut
  if (body.date_fin !== undefined) updates.date_fin = body.date_fin

  let result
  if (existing) {
    const { data, error } = await db
      .from('marketing_missions')
      .update(updates)
      .eq('entreprise_id', entreprise_id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await db
      .from('marketing_missions')
      .insert({ entreprise_id, ...updates })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ mission: result })
}
