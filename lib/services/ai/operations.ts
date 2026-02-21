// ============================================
// lib/services/ai/operations.ts
// Service IA Opérations — Productivité & Stratégie
// ============================================
import { createClient } from '@/lib/supabase/admin'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { OPERATIONS_ANALYSE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export interface AnalyseOperationsResult {
  score_productivite: number
  taches_bloquees: number
  goulots: Array<{ module: string; description: string; impact: string }>
  synthese_executive: string
  actions_prioritaires: Array<{
    priorite: number
    action: string
    module: string
    delai: string
    impact: string
  }>
}

export async function analyserOperations(entrepriseId: string): Promise<AnalyseOperationsResult> {
  const db = createClient()
  const maintenant = new Date()

  // Récupération des tâches + derniers rapports des 3 modules
  const [tachesRes, cashflowRes, hrRes, crmRes] = await Promise.all([
    db
      .from('taches')
      .select('titre, statut, priorite, priorite_ia, score_impact, module_origine, echeance, assigne_a, created_at, updated_at')
      .eq('entreprise_id', entrepriseId)
      .in('statut', ['bloquee', 'en_cours', 'a_faire'])
      .order('score_impact', { ascending: false })
      .limit(50),

    db
      .from('ai_cashflow_predictions')
      .select('tendance, niveau_risque, prevision_30j, recommandations')
      .eq('entreprise_id', entrepriseId)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db
      .from('ai_hr_reports')
      .select('score_sante_rh, employes_surcharge, contrats_a_renouveler, risques')
      .eq('entreprise_id', entrepriseId)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db
      .from('ai_sales_predictions')
      .select('revenu_prevu_30j, nb_deals_prevus, deals_en_danger, recommandations')
      .eq('entreprise_id', entrepriseId)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const taches = tachesRes.data || []
  const tachesBloquees = taches.filter(t => t.statut === 'bloquee')
  const tachesEnCours = taches.filter(t => t.statut === 'en_cours')
  const il_y_a_7j = new Date(maintenant)
  il_y_a_7j.setDate(il_y_a_7j.getDate() - 7)
  const tachesInactives = tachesEnCours.filter(t => new Date(t.updated_at) < il_y_a_7j)

  const contexteOps = {
    taches_actives: {
      total: taches.length,
      bloquees: tachesBloquees.length,
      en_cours: tachesEnCours.length,
      a_faire: taches.filter(t => t.statut === 'a_faire').length,
      inactives_7j: tachesInactives.length,
    },
    taches_critiques: taches
      .filter(t => t.priorite === 'critique' || t.priorite_ia === 'critique')
      .slice(0, 10)
      .map(t => ({
        titre: t.titre,
        statut: t.statut,
        priorite: t.priorite,
        module: t.module_origine,
        en_retard: t.echeance ? new Date(t.echeance) < maintenant : false,
      })),
    modules_snapshot: {
      finance: cashflowRes.data ? {
        tendance: cashflowRes.data.tendance,
        niveau_risque: cashflowRes.data.niveau_risque,
        prevision_30j: cashflowRes.data.prevision_30j,
        nb_recos: Array.isArray(cashflowRes.data.recommandations)
          ? cashflowRes.data.recommandations.length : 0,
      } : null,
      rh: hrRes.data ? {
        score_sante: hrRes.data.score_sante_rh,
        surcharge: hrRes.data.employes_surcharge,
        contrats_a_renouveler: hrRes.data.contrats_a_renouveler,
        risques: Array.isArray(hrRes.data.risques) ? hrRes.data.risques.length : 0,
      } : null,
      crm: crmRes.data ? {
        revenu_prevu_30j: crmRes.data.revenu_prevu_30j,
        nb_deals_prevus: crmRes.data.nb_deals_prevus,
        deals_en_danger: Array.isArray(crmRes.data.deals_en_danger)
          ? crmRes.data.deals_en_danger.length : 0,
      } : null,
    },
    date_analyse: maintenant.toISOString(),
  }

  const raw = await complete({
    model: MODELS.smart,
    system: OPERATIONS_ANALYSE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyse l'état opérationnel et génère le rapport :\n${JSON.stringify(contexteOps, null, 2)}`,
      },
    ],
    max_tokens: 1500,
  })

  let result: AnalyseOperationsResult
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    result = {
      score_productivite: 60,
      taches_bloquees: tachesBloquees.length,
      goulots: [],
      synthese_executive: raw.slice(0, 600),
      actions_prioritaires: [],
    }
  }

  // Persistance
  await db.from('ai_strategy_reports').upsert({
    entreprise_id: entrepriseId,
    genere_a: maintenant.toISOString(),
    type_rapport: 'quotidien',
    score_productivite: result.score_productivite,
    taches_bloquees: result.taches_bloquees,
    goulots: result.goulots,
    synthese_executive: result.synthese_executive,
    actions_prioritaires: result.actions_prioritaires,
    modules_snapshot: contexteOps.modules_snapshot,
  }, { onConflict: 'entreprise_id,type_rapport,genere_a' })

  return result
}

interface Tache {
  id: string
  titre: string
  statut: string
  priorite: string
  module_origine?: string
  echeance?: string
}

export async function prioriserTaches(
  taches: Tache[],
  contexte: { finance?: unknown; rh?: unknown; crm?: unknown }
): Promise<void> {
  const db = createClient()
  if (taches.length === 0) return

  const raw = await complete({
    model: MODELS.fast,
    system: `Tu es un COO expert. Pour chaque tâche, assigne une priorité IA et un score d'impact (0-100).
Retourne UNIQUEMENT un tableau JSON : [{"id": "<id>", "priorite_ia": "critique|haute|normale|faible", "score_impact": <0-100>}]`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          taches: taches.slice(0, 20).map(t => ({
            id: t.id,
            titre: t.titre,
            statut: t.statut,
            priorite_actuelle: t.priorite,
            module: t.module_origine,
            en_retard: t.echeance ? new Date(t.echeance) < new Date() : false,
          })),
          contexte_business: contexte,
        }),
      },
    ],
    max_tokens: 800,
  })

  let scores: Array<{ id: string; priorite_ia: string; score_impact: number }> = []
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    scores = JSON.parse(cleaned)
  } catch { return }

  // Bulk update
  await Promise.all(
    scores.map(s =>
      db.from('taches').update({
        priorite_ia: s.priorite_ia,
        score_impact: s.score_impact,
      }).eq('id', s.id)
    )
  )
}

export async function genererSyntheseExecutive(
  entrepriseId: string,
  type: 'quotidien' | 'hebdomadaire' | 'mensuel'
): Promise<AnalyseOperationsResult> {
  const db = createClient()
  const maintenant = new Date()

  // Lire le dernier rapport opérations
  const { data: dernierRapport } = await db
    .from('ai_strategy_reports')
    .select('*')
    .eq('entreprise_id', entrepriseId)
    .eq('type_rapport', type)
    .order('genere_a', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (dernierRapport) {
    return {
      score_productivite: dernierRapport.score_productivite,
      taches_bloquees: dernierRapport.taches_bloquees,
      goulots: (dernierRapport.goulots as AnalyseOperationsResult['goulots']) || [],
      synthese_executive: dernierRapport.synthese_executive,
      actions_prioritaires: (dernierRapport.actions_prioritaires as AnalyseOperationsResult['actions_prioritaires']) || [],
    }
  }

  // Sinon générer un nouveau rapport
  const result = await analyserOperations(entrepriseId)

  // Mettre à jour le type
  await db.from('ai_strategy_reports')
    .update({ type_rapport: type })
    .eq('entreprise_id', entrepriseId)
    .gte('genere_a', maintenant.toISOString().split('T')[0])

  return result
}
