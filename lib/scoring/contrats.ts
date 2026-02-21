// ============================================
// lib/scoring/contrats.ts
// Logique de scoring Module 4 — Contrats
// ============================================
import { createClient } from '@/lib/supabase/admin'

export interface ScoreContratsResult {
  score: number
  niveau: 'faible' | 'modere' | 'eleve' | 'critique'
  nb_contrats: number
  nb_analyses: number
  score_moyen_risque: number
  detail: Record<string, any>
}

export async function calculerScoreContrats(entrepriseId: string): Promise<ScoreContratsResult> {
  const admin = createClient()

  const { data: analyses } = await admin
    .from('analyses_contrats')
    .select('score_risque, niveau_risque, document_id')
    .eq('entreprise_id', entrepriseId)

  const { data: documents } = await admin
    .from('documents_contrats')
    .select('id')
    .eq('entreprise_id', entrepriseId)
    .neq('statut', 'archive')

  if (!analyses || analyses.length === 0) {
    return {
      score: 50, // Neutre si aucun contrat analysé
      niveau: 'modere',
      nb_contrats: documents?.length ?? 0,
      nb_analyses: 0,
      score_moyen_risque: 50,
      detail: {},
    }
  }

  // Score contractuel = moyenne des scores de risque des contrats (inversé)
  // score_risque dans analyses_contrats va de 0 (risque max) à 100 (risque min)
  const scoreMoyen = analyses.reduce((acc, a) => acc + (a.score_risque ?? 50), 0) / analyses.length

  const score = Math.round(scoreMoyen)

  const niveau: ScoreContratsResult['niveau'] =
    score >= 75 ? 'faible' :
    score >= 50 ? 'modere' :
    score >= 30 ? 'eleve' : 'critique'

  return {
    score: Math.max(0, Math.min(100, score)),
    niveau,
    nb_contrats: documents?.length ?? 0,
    nb_analyses: analyses.length,
    score_moyen_risque: Math.round(100 - scoreMoyen), // Inversé pour affichage
    detail: {
      critiques: analyses.filter(a => a.niveau_risque === 'critique').length,
      eleves: analyses.filter(a => a.niveau_risque === 'eleve').length,
      moderes: analyses.filter(a => a.niveau_risque === 'modere').length,
      faibles: analyses.filter(a => a.niveau_risque === 'faible').length,
    },
  }
}
