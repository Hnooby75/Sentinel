// ============================================
// lib/scoring/global.ts
// Score global unifié — agrège les 5 modules
// ============================================
import { createClient } from '@/lib/supabase/admin'
import { calculerScore } from './engine'
import { calculerScoreImpayes } from './impayes'
import { calculerScoreObligations } from './obligations'
import { calculerScoreFinancier } from './financier'
import { calculerScoreContrats } from './contrats'

export interface ScoreGlobalResult {
  score_global: number
  score_conformite_ia: number
  score_impayes: number
  score_obligations: number
  score_contractuel: number
  score_financier: number
  niveau: 'critique' | 'insuffisant' | 'partiel' | 'bon' | 'excellent'
  recommandations_cles: Array<{
    module: string
    priorite: string
    titre: string
    description: string
    href: string
  }>
}

// Poids des modules
const POIDS = {
  conformite_ia: 0.20,
  impayes: 0.20,
  obligations: 0.25,
  contractuel: 0.15,
  financier: 0.20,
}

export async function calculerScoreGlobal(entrepriseId: string): Promise<ScoreGlobalResult> {
  // Calcul de tous les scores en parallèle
  const [scoreIA, scoreImpayes, scoreObligations, scoreContrats, scoreFinancier] = await Promise.all([
    calculerScore(entrepriseId).then(r => r.score_global).catch(e => { console.error('[score-global] conformite_ia error:', e); return 50 }),
    calculerScoreImpayes(entrepriseId).then(r => r.score).catch(e => { console.error('[score-global] impayes error:', e); return 50 }),
    calculerScoreObligations(entrepriseId).then(r => r.score).catch(e => { console.error('[score-global] obligations error:', e); return 50 }),
    calculerScoreContrats(entrepriseId).then(r => r.score).catch(e => { console.error('[score-global] contrats error:', e); return 50 }),
    calculerScoreFinancier(entrepriseId).then(r => r.score).catch(e => { console.error('[score-global] financier error:', e); return 50 }),
  ])

  const scoreGlobal = Math.round(
    scoreIA * POIDS.conformite_ia +
    scoreImpayes * POIDS.impayes +
    scoreObligations * POIDS.obligations +
    scoreContrats * POIDS.contractuel +
    scoreFinancier * POIDS.financier
  )

  const niveau = getNiveauGlobal(scoreGlobal)

  // Recommandations clés (top 5 cross-modules)
  const recommandations: ScoreGlobalResult['recommandations_cles'] = []

  if (scoreIA < 50) {
    recommandations.push({
      module: 'Conformité IA',
      priorite: 'haute',
      titre: 'Score conformité IA insuffisant',
      description: 'Complétez vos journaux d\'usage IA pour améliorer votre conformité AI Act.',
      href: '/dashboard/journaux',
    })
  }
  if (scoreImpayes < 60) {
    recommandations.push({
      module: 'Impayés',
      priorite: scoreImpayes < 40 ? 'urgente' : 'haute',
      titre: 'Risque impayés élevé',
      description: 'Des factures en retard ou en contentieux menacent votre trésorerie.',
      href: '/dashboard/impayes',
    })
  }
  if (scoreObligations < 60) {
    recommandations.push({
      module: 'Obligations',
      priorite: scoreObligations < 40 ? 'urgente' : 'haute',
      titre: 'Obligations en retard',
      description: 'Certaines obligations légales ne sont pas remplies ou en retard.',
      href: '/dashboard/obligations',
    })
  }
  if (scoreContrats < 50) {
    recommandations.push({
      module: 'Contrats',
      priorite: 'normale',
      titre: 'Risques contractuels identifiés',
      description: 'Des clauses sensibles ont été détectées dans vos contrats.',
      href: '/dashboard/contrats',
    })
  }
  if (scoreFinancier < 50) {
    recommandations.push({
      module: 'Financier',
      priorite: scoreFinancier < 30 ? 'urgente' : 'normale',
      titre: 'Solidité financière fragile',
      description: 'Votre trésorerie ou vos charges nécessitent une attention particulière.',
      href: '/dashboard/financier',
    })
  }

  return {
    score_global: Math.max(0, Math.min(100, scoreGlobal)),
    score_conformite_ia: scoreIA,
    score_impayes: scoreImpayes,
    score_obligations: scoreObligations,
    score_contractuel: scoreContrats,
    score_financier: scoreFinancier,
    niveau,
    recommandations_cles: recommandations.slice(0, 5),
  }
}

function getNiveauGlobal(score: number): ScoreGlobalResult['niveau'] {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'bon'
  if (score >= 50) return 'partiel'
  if (score >= 30) return 'insuffisant'
  return 'critique'
}

export async function sauvegarderScoreGlobal(entrepriseId: string, result: ScoreGlobalResult) {
  const admin = createClient()
  await admin.from('scores_globaux').insert({
    entreprise_id: entrepriseId,
    score_global: result.score_global,
    score_conformite_ia: result.score_conformite_ia,
    score_impayes: result.score_impayes,
    score_obligations: result.score_obligations,
    score_contractuel: result.score_contractuel,
    score_financier: result.score_financier,
    niveau: result.niveau,
    recommandations_cles: result.recommandations_cles,
  })
}
