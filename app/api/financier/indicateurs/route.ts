// ============================================
// app/api/financier/indicateurs/route.ts
// Module 5 — Recalcul indicateurs financiers
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScoreFinancier } from '@/lib/scoring/financier'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const result = await calculerScoreFinancier(utilisateur.entreprise_id)

  const admin = createAdminClient()
  await admin.from('indicateurs_financiers').insert({
    entreprise_id: utilisateur.entreprise_id,
    ratio_tresorerie: result.ratio_tresorerie,
    ratio_charges: result.ratio_charges,
    tendance_ca: result.tendance_ca,
    runway_mois: result.runway_mois,
    score_solidite: result.score,
    niveau: result.niveau,
    detail: result.detail,
  })

  // Synchroniser scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (globalResult) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, globalResult)
  }).catch(console.error)

  return NextResponse.json(result)
}
