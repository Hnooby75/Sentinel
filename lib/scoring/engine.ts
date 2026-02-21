// ============================================
// lib/scoring/engine.ts
// Moteur de calcul du score de conformité AI Act
// Score 0-100 basé sur 4 dimensions pondérées
// ============================================
import { createClient } from '@/lib/supabase/admin'

export interface ScoreResult {
  score_global: number
  score_documentation: number
  score_classification: number
  score_mitigation: number
  score_gouvernance: number
  niveau_conformite: 'critique' | 'insuffisant' | 'partiel' | 'bon' | 'excellent'
  detail_calcul: Record<string, any>
  recommandations: Recommandation[]
}

export interface Recommandation {
  priorite: 'urgente' | 'haute' | 'normale' | 'info'
  titre: string
  description: string
  action: string
  impact_score: number
}

export async function calculerScore(entrepriseId: string): Promise<ScoreResult> {
  const supabase = createClient()

  const [{ data: journaux }, { data: utilisateurs }] = await Promise.all([
    supabase.from('journaux_usage_ia').select('*')
      .eq('entreprise_id', entrepriseId).eq('statut', 'actif'),
    supabase.from('utilisateurs').select('id, role')
      .eq('entreprise_id', entrepriseId).eq('actif', true),
  ])

  if (!journaux || journaux.length === 0) {
    return {
      score_global: 0,
      score_documentation: 0,
      score_classification: 0,
      score_mitigation: 0,
      score_gouvernance: 0,
      niveau_conformite: 'critique',
      detail_calcul: {},
      recommandations: [{
        priorite: 'urgente',
        titre: 'Aucun usage IA déclaré',
        description: 'Vous n\'avez documenté aucun usage IA. En cas de contrôle, vous ne pouvez pas prouver votre conformité.',
        action: 'Déclarer votre premier usage IA',
        impact_score: 100,
      }]
    }
  }

  // ---- Dimension 1: Documentation (30%)
  const doc = scoreDocumentation(journaux)

  // ---- Dimension 2: Classification des risques (30%)
  const cls = scoreClassification(journaux)

  // ---- Dimension 3: Mesures de mitigation (25%)
  const mit = scoreMitigation(journaux)

  // ---- Dimension 4: Gouvernance (15%)
  const gouv = scoreGouvernance(journaux, utilisateurs || [])

  const scoreGlobal = Math.round(
    doc.score * 0.30 +
    cls.score * 0.30 +
    mit.score * 0.25 +
    gouv.score * 0.15
  )

  const recommandations = [
    ...cls.recommandations,
    ...doc.recommandations,
    ...mit.recommandations,
    ...gouv.recommandations,
  ].sort((a, b) => {
    const ordre = { urgente: 0, haute: 1, normale: 2, info: 3 }
    return ordre[a.priorite] - ordre[b.priorite]
  })

  return {
    score_global: Math.max(0, Math.min(100, scoreGlobal)),
    score_documentation: doc.score,
    score_classification: cls.score,
    score_mitigation: mit.score,
    score_gouvernance: gouv.score,
    niveau_conformite: getNiveau(scoreGlobal),
    detail_calcul: { documentation: doc, classification: cls, mitigation: mit, gouvernance: gouv },
    recommandations: recommandations.slice(0, 10), // Max 10 recommandations
  }
}

function scoreDocumentation(journaux: any[]): { score: number; recommandations: Recommandation[] } {
  const recs: Recommandation[] = []
  let points = 0

  // Titre + description suffisants
  const bienDecrits = journaux.filter(j => j.titre?.length > 10 && j.description?.length > 30)
  points += Math.round((bienDecrits.length / journaux.length) * 25)
  if (bienDecrits.length < journaux.length) {
    recs.push({
      priorite: 'normale',
      titre: 'Descriptions insuffisantes',
      description: `${journaux.length - bienDecrits.length} journal(aux) ont une description trop courte pour être probants en cas d'audit.`,
      action: 'Compléter les journaux',
      impact_score: 10,
    })
  }

  // Outil IA identifié
  const avecOutil = journaux.filter(j => j.outil_ia)
  points += Math.round((avecOutil.length / journaux.length) * 15)

  // Date premier usage renseignée
  const avecDate = journaux.filter(j => j.date_premier_usage)
  points += Math.round((avecDate.length / journaux.length) * 10)

  // Données personnelles → base légale RGPD documentée
  const avecDonneesPerso = journaux.filter(j => j.traite_donnees_perso)
  const avecBaseLegale = avecDonneesPerso.filter(j => j.base_legale_rgpd)
  const sansBaseLegale = avecDonneesPerso.length - avecBaseLegale.length

  if (avecDonneesPerso.length > 0) {
    points += Math.round((avecBaseLegale.length / avecDonneesPerso.length) * 30)
    if (sansBaseLegale > 0) {
      recs.push({
        priorite: 'haute',
        titre: 'Base légale RGPD manquante',
        description: `${sansBaseLegale} usage(s) traitent des données personnelles sans base légale RGPD documentée. C'est une obligation légale.`,
        action: 'Compléter les journaux',
        impact_score: 15,
      })
    }
  } else {
    points += 30 // Pas de données perso → pas d'obligation RGPD
  }

  // Fréquence renseignée
  const avecFrequence = journaux.filter(j => j.frequence_usage)
  points += Math.round((avecFrequence.length / journaux.length) * 20)

  return { score: Math.min(100, points), recommandations: recs }
}

function scoreClassification(journaux: any[]): { score: number; recommandations: Recommandation[] } {
  const recs: Recommandation[] = []
  let points = 0

  // Usages inacceptables actifs → pénalité sévère (cumulative, max -80)
  const inacceptables = journaux.filter(j => j.niveau_risque === 'inacceptable')
  if (inacceptables.length > 0) {
    const penalite = Math.min(80, inacceptables.length * 40)
    points -= penalite
    recs.push({
      priorite: 'urgente',
      titre: '⚠️ Usage interdit par l\'AI Act',
      description: `${inacceptables.length} usage(s) sont classifiés "inacceptable" selon l'AI Act. Ces usages sont INTERDITS et exposent votre entreprise à des amendes allant jusqu'à 35M€.`,
      action: 'Voir les journaux à risque inacceptable',
      impact_score: penalite,
    })
  }

  // Tous classifiés ?
  const nonClasses = journaux.filter(j => j.niveau_risque === 'non_classe')
  const pctClasses = (journaux.length - nonClasses.length) / journaux.length
  points += Math.round(pctClasses * 40)

  if (nonClasses.length > 0) {
    recs.push({
      priorite: nonClasses.length > journaux.length * 0.5 ? 'haute' : 'normale',
      titre: 'Usages non classifiés',
      description: `${nonClasses.length} usage(s) IA n'ont pas encore été classifiés par niveau de risque. Sans classification, votre conformité AI Act est incomplète.`,
      action: 'Voir les journaux non classifiés',
      impact_score: 15,
    })
  }

  // Usages à risque élevé → mesures de mitigation ?
  const elevesEtInacceptables = journaux.filter(j => ['eleve', 'inacceptable'].includes(j.niveau_risque))
  const elevesAvecMitigation = elevesEtInacceptables.filter(
    j => Array.isArray(j.mesures_mitigation) && j.mesures_mitigation.length > 0
  )

  if (elevesEtInacceptables.length > 0) {
    const ratio = elevesAvecMitigation.length / elevesEtInacceptables.length
    points += Math.round(ratio * 40)
    if (ratio < 1) {
      recs.push({
        priorite: 'haute',
        titre: 'Risques élevés sans mitigation',
        description: `${elevesEtInacceptables.length - elevesAvecMitigation.length} usage(s) à risque élevé n'ont aucune mesure de protection documentée. L'AI Act l'exige explicitement.`,
        action: 'Documenter les mesures de mitigation',
        impact_score: 20,
      })
    }
  } else {
    points += 40
  }

  return { score: Math.max(0, Math.min(100, points)), recommandations: recs }
}

function scoreMitigation(journaux: any[]): { score: number; recommandations: Recommandation[] } {
  const recs: Recommandation[] = []

  const avecMesures = journaux.filter(
    j => Array.isArray(j.mesures_mitigation) && j.mesures_mitigation.length > 0
  )
  const pct = avecMesures.length / journaux.length
  const score = Math.round(pct * 100)

  if (pct < 0.5) {
    recs.push({
      priorite: 'normale',
      titre: 'Peu de mesures de mitigation documentées',
      description: `Seulement ${Math.round(pct * 100)}% de vos usages IA ont des mesures de protection documentées. Ces mesures démontrent votre engagement envers la conformité.`,
      action: 'Compléter les mesures de mitigation',
      impact_score: 8,
    })
  }

  return { score, recommandations: recs }
}

function scoreGouvernance(journaux: any[], utilisateurs: any[]): { score: number; recommandations: Recommandation[] } {
  const recs: Recommandation[] = []
  let points = 0

  // Admin désigné ?
  const admins = utilisateurs.filter(u => u.role === 'admin')
  if (admins.length > 0) {
    points += 30
  } else {
    recs.push({
      priorite: 'normale',
      titre: 'Aucun responsable conformité désigné',
      description: 'Désignez un administrateur qui sera responsable du suivi de la conformité AI dans votre organisation.',
      action: 'Gérer l\'équipe',
      impact_score: 5,
    })
  }

  // Journaux récemment mis à jour (< 90 jours)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const recents = journaux.filter(j => new Date(j.updated_at) > cutoff)
  const pctRecents = recents.length / journaux.length
  points += Math.round(pctRecents * 40)

  if (pctRecents < 0.7) {
    recs.push({
      priorite: 'normale',
      titre: 'Journaux non maintenus',
      description: `${journaux.length - recents.length} journal(aux) n'ont pas été mis à jour depuis plus de 90 jours. La conformité nécessite une révision régulière.`,
      action: 'Réviser les anciens journaux',
      impact_score: 7,
    })
  }

  // Journaux "à revoir" traités
  const aRevoir = journaux.filter(j => j.statut === 'a_revoir')
  if (aRevoir.length === 0) {
    points += 30
  } else {
    recs.push({
      priorite: 'normale',
      titre: `${aRevoir.length} journal(aux) à revoir`,
      description: 'Des journaux sont marqués "à revoir" et attendent une mise à jour. Traitez-les pour maintenir la qualité de votre documentation.',
      action: 'Voir les journaux à revoir',
      impact_score: 5,
    })
  }

  return { score: Math.min(100, Math.max(0, points)), recommandations: recs }
}

function getNiveau(score: number): ScoreResult['niveau_conformite'] {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'bon'
  if (score >= 50) return 'partiel'
  if (score >= 25) return 'insuffisant'
  return 'critique'
}
