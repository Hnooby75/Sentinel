// ============================================
// lib/scoring/financier.ts
// Logique de scoring Module 5 — Solidité financière
// ============================================
import { createClient } from '@/lib/supabase/admin'

export interface ScoreFinancierResult {
  score: number
  niveau: 'fragile' | 'correct' | 'solide' | 'excellent'
  ratio_tresorerie: number
  ratio_charges: number
  tendance_ca: 'hausse' | 'stable' | 'baisse' | null
  runway_mois: number
  detail: Record<string, any>
}

export async function calculerScoreFinancier(entrepriseId: string): Promise<ScoreFinancierResult> {
  const admin = createClient()

  // Récupérer les 12 derniers mois de flux
  const { data: flux } = await admin
    .from('flux_financiers')
    .select('mois, ca_mensuel, charges_fixes, charges_variables, tresorerie')
    .eq('entreprise_id', entrepriseId)
    .order('mois', { ascending: false })
    .limit(12)

  if (!flux || flux.length === 0) {
    return {
      score: 50, // Neutre si aucune donnée
      niveau: 'correct',
      ratio_tresorerie: 0,
      ratio_charges: 0,
      tendance_ca: null,
      runway_mois: 0,
      detail: {},
    }
  }

  const dernierFlux = flux[0]
  const tresorerie = Number(dernierFlux.tresorerie)

  // Calcul charges mensuelles moyennes (3 derniers mois)
  const trosDerniersMois = flux.slice(0, 3)
  const chargesMoyennes = trosDerniersMois.reduce(
    (acc, f) => acc + Number(f.charges_fixes) + Number(f.charges_variables),
    0
  ) / trosDerniersMois.length

  // Runway
  const runwayMois = chargesMoyennes > 0 ? tresorerie / chargesMoyennes : 99

  // Ratio trésorerie (en mois de charges)
  const ratioTresorerie = chargesMoyennes > 0 ? runwayMois : 6

  // Ratio charges / CA (dernier mois)
  const derniersCA = Number(dernierFlux.ca_mensuel)
  const derniersCharges = Number(dernierFlux.charges_fixes) + Number(dernierFlux.charges_variables)
  const ratioCharges = derniersCA > 0 ? (derniersCharges / derniersCA) * 100 : 100

  // Tendance CA : 3 derniers mois vs 3 mois précédents
  let tendanceCa: 'hausse' | 'stable' | 'baisse' | null = null
  if (flux.length >= 6) {
    const recents = flux.slice(0, 3)
    const precedents = flux.slice(3, 6)
    const caRecent = recents.reduce((acc, f) => acc + Number(f.ca_mensuel), 0) / recents.length
    const caPrecedent = precedents.reduce((acc, f) => acc + Number(f.ca_mensuel), 0) / precedents.length
    if (caPrecedent > 0) {
      const variation = ((caRecent - caPrecedent) / caPrecedent) * 100
      if (variation >= 5) tendanceCa = 'hausse'
      else if (variation <= -5) tendanceCa = 'baisse'
      else tendanceCa = 'stable'
    }
  }

  // Score trésorerie (sur 40 pts)
  let scoreTresorerie: number
  if (ratioTresorerie >= 6) scoreTresorerie = 100
  else if (ratioTresorerie >= 3) scoreTresorerie = 75
  else if (ratioTresorerie >= 1) scoreTresorerie = 50
  else scoreTresorerie = 20

  // Score charges (sur 40 pts)
  let scoreCharges: number
  if (ratioCharges < 50) scoreCharges = 100
  else if (ratioCharges <= 65) scoreCharges = 75
  else if (ratioCharges <= 80) scoreCharges = 50
  else scoreCharges = 20

  // Score tendance (sur 20 pts)
  let scoreTendance: number
  if (tendanceCa === 'hausse') scoreTendance = 100
  else if (tendanceCa === 'stable') scoreTendance = 75
  else if (tendanceCa === 'baisse') scoreTendance = 30
  else scoreTendance = 60 // Pas assez de données → neutre

  const score = Math.round(
    scoreTresorerie * 0.40 +
    scoreCharges * 0.40 +
    scoreTendance * 0.20
  )

  const niveau: ScoreFinancierResult['niveau'] =
    score >= 80 ? 'excellent' :
    score >= 60 ? 'solide' :
    score >= 40 ? 'correct' : 'fragile'

  return {
    score: Math.max(0, Math.min(100, score)),
    niveau,
    ratio_tresorerie: Math.round(ratioTresorerie * 100) / 100,
    ratio_charges: Math.round(ratioCharges * 100) / 100,
    tendance_ca: tendanceCa,
    runway_mois: Math.round(runwayMois * 10) / 10,
    detail: {
      score_tresorerie: scoreTresorerie,
      score_charges: scoreCharges,
      score_tendance: scoreTendance,
      nb_mois_donnees: flux.length,
      tresorerie_actuelle: tresorerie,
      charges_mensuelles_moy: Math.round(chargesMoyennes),
    },
  }
}
