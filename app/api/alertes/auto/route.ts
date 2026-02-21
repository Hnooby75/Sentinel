// ============================================
// app/api/alertes/auto/route.ts
// POST — vérifie et envoie les alertes automatiques
// Déduplication via alertes_envoyees (ref_id = mois YYYY-MM)
// ============================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { sendObligationAlert, sendImpayeAlert, sendScoreDropAlert } from '@/lib/email'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs')
    .select('entreprise_id, email, entreprise:entreprises(nom, plan, plan_actif)')
    .eq('id', user.id)
    .single()

  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const eid = utilisateur.entreprise_id
  const now = new Date()
  const moisRef = now.toISOString().slice(0, 7) // YYYY-MM
  const entrepriseNom = (utilisateur.entreprise as any)?.nom || 'votre entreprise'
  const to = utilisateur.email

  const alertes: { type: string; ref_id: string; sent: boolean }[] = []

  async function dejaEnvoyee(type: string, ref_id: string): Promise<boolean> {
    const { data } = await admin
      .from('alertes_envoyees')
      .select('id')
      .eq('entreprise_id', eid)
      .eq('type', type)
      .eq('ref_id', ref_id)
      .maybeSingle()
    return !!data
  }

  async function marquerEnvoyee(type: string, ref_id: string) {
    await admin.from('alertes_envoyees').upsert({
      entreprise_id: eid,
      type,
      ref_id,
      envoyee_at: now.toISOString(),
    }, { onConflict: 'entreprise_id,type,ref_id', ignoreDuplicates: true })
  }

  // ─── 1. Obligations en retard ──────────────────────────────────────────────
  const alerteType1 = 'obligations_retard'
  const ref1 = moisRef
  if (!(await dejaEnvoyee(alerteType1, ref1))) {
    const { data: obligsEnRetard } = await admin
      .from('obligations')
      .select('id')
      .eq('entreprise_id', eid)
      .eq('statut', 'en_retard')
    const count = obligsEnRetard?.length ?? 0
    if (count > 0) {
      await sendObligationAlert(to, entrepriseNom, count)
      await marquerEnvoyee(alerteType1, ref1)
      alertes.push({ type: alerteType1, ref_id: ref1, sent: true })
    }
  } else {
    alertes.push({ type: alerteType1, ref_id: ref1, sent: false })
  }

  // ─── 2. Factures > 60j impayées ────────────────────────────────────────────
  const alerteType2 = 'impayes_60j'
  const ref2 = moisRef
  if (!(await dejaEnvoyee(alerteType2, ref2))) {
    const cutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data: facturesEnRetard } = await admin
      .from('factures')
      .select('id')
      .eq('entreprise_id', eid)
      .in('statut', ['en_retard', 'contentieux'])
      .lt('date_echeance', cutoff)
    const count = facturesEnRetard?.length ?? 0
    if (count > 0) {
      await sendImpayeAlert(to, entrepriseNom, count)
      await marquerEnvoyee(alerteType2, ref2)
      alertes.push({ type: alerteType2, ref_id: ref2, sent: true })
    }
  } else {
    alertes.push({ type: alerteType2, ref_id: ref2, sent: false })
  }

  // ─── 3. Score global en chute > 15 pts ─────────────────────────────────────
  const alerteType3 = 'score_chute_15'
  const ref3 = moisRef
  if (!(await dejaEnvoyee(alerteType3, ref3))) {
    const { data: scoresHist } = await admin
      .from('scores_globaux')
      .select('score_global, calcule_a')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false })
      .limit(2)
    if (scoresHist && scoresHist.length >= 2) {
      const drop = scoresHist[1].score_global - scoresHist[0].score_global
      if (drop >= 15) {
        await sendScoreDropAlert(to, entrepriseNom, drop)
        await marquerEnvoyee(alerteType3, ref3)
        alertes.push({ type: alerteType3, ref_id: ref3, sent: true })
      }
    }
  } else {
    alertes.push({ type: alerteType3, ref_id: ref3, sent: false })
  }

  return NextResponse.json({ success: true, alertes })
}
