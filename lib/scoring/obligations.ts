// ============================================
// lib/scoring/obligations.ts
// Logique de scoring Module 3 — Obligations administratives
// ============================================
import { createClient } from '@/lib/supabase/admin'

export interface ScoreObligationsResult {
  score: number
  niveau: 'critique' | 'insuffisant' | 'partiel' | 'bon' | 'excellent'
  nb_total: number
  nb_validees: number
  nb_en_retard: number
  nb_a_faire: number
  taux_completion: number
  detail: Record<string, any>
}

export async function calculerScoreObligations(entrepriseId: string): Promise<ScoreObligationsResult> {
  const admin = createClient()

  const { data: obligations } = await admin
    .from('obligations')
    .select('id, statut, echeance')
    .eq('entreprise_id', entrepriseId)

  if (!obligations || obligations.length === 0) {
    return {
      score: 50, // Neutre si aucune obligation saisie
      niveau: 'partiel',
      nb_total: 0,
      nb_validees: 0,
      nb_en_retard: 0,
      nb_a_faire: 0,
      taux_completion: 0,
      detail: {},
    }
  }

  const actives = obligations.filter(o => o.statut !== 'non_applicable')
  const validees = actives.filter(o => o.statut === 'valide')
  const enRetard = actives.filter(o => o.statut === 'en_retard')
  const aFaire = actives.filter(o => o.statut === 'a_faire')
  const enCours = actives.filter(o => o.statut === 'en_cours')

  // Auto-mise à jour des statuts en retard basée sur l'échéance
  const maintenant = new Date()
  const enRetardAuto = actives.filter(o =>
    o.statut === 'a_faire' &&
    o.echeance &&
    new Date(o.echeance) < maintenant
  )

  // Persister le statut 'en_retard' en DB pour les obligations dépassées
  if (enRetardAuto.length > 0) {
    const idsRetard = enRetardAuto.map(o => o.id)
    await admin
      .from('obligations')
      .update({ statut: 'en_retard' })
      .in('id', idsRetard)
  }

  const totalEnRetard = enRetard.length + enRetardAuto.length

  // Score proportionnel basé sur le total d'obligations actives
  let score: number
  if (actives.length === 0) {
    score = 50
  } else {
    const pctValidees = validees.length / actives.length
    const pctEnCours = enCours.length / actives.length
    const pctEnRetard = totalEnRetard / actives.length

    // Validées = jusqu'à 70 pts, en_cours = jusqu'à 15 pts, en_retard = pénalité jusqu'à -50 pts
    score = Math.round(pctValidees * 70 + pctEnCours * 15 - pctEnRetard * 50)
  }

  const tauxCompletion = actives.length > 0
    ? Math.round((validees.length / actives.length) * 100)
    : 0

  score = Math.max(0, Math.min(100, score))

  const niveau: ScoreObligationsResult['niveau'] =
    score >= 85 ? 'excellent' :
    score >= 70 ? 'bon' :
    score >= 50 ? 'partiel' :
    score >= 30 ? 'insuffisant' : 'critique'

  return {
    score,
    niveau,
    nb_total: actives.length,
    nb_validees: validees.length,
    nb_en_retard: totalEnRetard,
    nb_a_faire: aFaire.length,
    taux_completion: tauxCompletion,
    detail: {
      en_cours: enCours.length,
      non_applicable: obligations.filter(o => o.statut === 'non_applicable').length,
    },
  }
}
