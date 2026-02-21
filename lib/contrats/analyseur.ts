// ============================================
// lib/contrats/analyseur.ts
// Analyse contractuelle par pattern matching (sans LLM)
// ============================================

export interface PointSensible {
  type: string
  description: string
  impact: 'faible' | 'modere' | 'eleve' | 'critique'
  extrait?: string
  poids: number
}

export interface ResultatAnalyse {
  score_risque: number
  niveau_risque: 'faible' | 'modere' | 'eleve' | 'critique'
  resume: string
  points_sensibles: PointSensible[]
  recommandations: string[]
}

// Règles de détection par pattern matching
const REGLES: Array<{
  patterns: RegExp[]
  type: string
  description: string
  impact: PointSensible['impact']
  poids: number
  recommandation: string
}> = [
  {
    patterns: [/pénalité.{0,30}unilatéral/i, /pénalité.{0,30}sans.{0,20}accord/i, /indemnité.{0,30}unilatéral/i],
    type: 'penalite_unilaterale',
    description: 'Clause de pénalité unilatérale détectée',
    impact: 'eleve',
    poids: 20,
    recommandation: 'Négociez des pénalités mutuelles et plafonnées.',
  },
  {
    patterns: [/durée indéterminée/i, /tacite reconduction/i, /renouvellement automatique/i, /sans durée fixe/i],
    type: 'duree_indefinie',
    description: 'Durée indéfinie ou tacite reconduction',
    impact: 'modere',
    poids: 12,
    recommandation: 'Précisez la durée et les conditions de renouvellement.',
  },
  {
    patterns: [/juridiction.{0,50}(étrang|etranger|foreign)/i, /droit applicable.{0,50}(étrang|etranger)/i, /tribunal.{0,50}(étrang|etranger)/i, /loi.{0,20}(anglais|américain|américaine|anglaise)/i],
    type: 'juridiction_etrangere',
    description: 'Juridiction ou droit étranger applicable',
    impact: 'eleve',
    poids: 18,
    recommandation: 'Privilégiez une juridiction française ou européenne.',
  },
  {
    patterns: [/exclut.{0,50}toute responsabilité/i, /aucune responsabilité/i, /responsabilité totalement exclue/i, /décharge totale/i],
    type: 'exclusion_responsabilite',
    description: 'Exclusion totale de responsabilité',
    impact: 'critique',
    poids: 30,
    recommandation: 'Exigez un plafond de responsabilité raisonnable, pas une exclusion totale.',
  },
  {
    patterns: [/données personnelles.{0,100}(sans|aucune).{0,30}base légale/i, /traitement.{0,50}données.{0,50}sans consentement/i],
    type: 'donnees_sans_base_legale',
    description: 'Traitement de données personnelles sans base légale',
    impact: 'eleve',
    poids: 20,
    recommandation: 'Documentez la base légale RGPD pour tout traitement de données.',
  },
  {
    patterns: [/prix.{0,50}variable/i, /tarif.{0,50}indexé/i, /révision.{0,30}prix.{0,50}unilatéral/i, /augmentation.{0,30}prix.{0,50}sans.{0,30}accord/i],
    type: 'prix_variable_non_plafonne',
    description: 'Prix variable non plafonné',
    impact: 'modere',
    poids: 12,
    recommandation: 'Plafonnez les révisions de prix ou exigez un accord préalable.',
  },
  {
    patterns: [/résiliation immédiate/i, /résiliation sans préavis/i, /résiliation.{0,30}(immédiat|sans délai)/i],
    type: 'resiliation_sans_preavis',
    description: 'Résiliation immédiate sans préavis',
    impact: 'modere',
    poids: 10,
    recommandation: 'Négociez un préavis minimum (30 jours recommandé).',
  },
  {
    patterns: [/propriété intellectuelle.{0,100}(cédée|transférée|appartient).{0,50}(définitivement|totalement)/i, /cession.{0,30}droits.{0,50}(totale|complète|exclusive)/i],
    type: 'cession_pi_totale',
    description: 'Cession totale des droits de propriété intellectuelle',
    impact: 'eleve',
    poids: 15,
    recommandation: 'Limitez la cession aux droits strictement nécessaires.',
  },
  {
    patterns: [/clause de non-concurrence/i, /non.concurrence/i, /interdit.{0,50}concurren/i],
    type: 'non_concurrence',
    description: 'Clause de non-concurrence',
    impact: 'modere',
    poids: 8,
    recommandation: 'Vérifiez la durée et le périmètre géographique de la clause.',
  },
]

export function analyserContrat(texte: string): ResultatAnalyse {
  if (!texte || texte.trim().length < 50) {
    return {
      score_risque: 50,
      niveau_risque: 'modere',
      resume: 'Texte insuffisant pour une analyse complète.',
      points_sensibles: [],
      recommandations: ['Fournissez le texte complet du contrat pour une analyse approfondie.'],
    }
  }

  const pointsDetectes: PointSensible[] = []
  const recommandations: string[] = []

  for (const regle of REGLES) {
    for (const pattern of regle.patterns) {
      const match = texte.match(pattern)
      if (match) {
        // Extraire un contexte autour du match
        const idx = texte.indexOf(match[0])
        const debut = Math.max(0, idx - 50)
        const fin = Math.min(texte.length, idx + match[0].length + 50)
        const extrait = '...' + texte.slice(debut, fin).trim() + '...'

        pointsDetectes.push({
          type: regle.type,
          description: regle.description,
          impact: regle.impact,
          extrait,
          poids: regle.poids,
        })
        recommandations.push(regle.recommandation)
        break // Un seul match par règle
      }
    }
  }

  // Calcul du score de risque
  const poidsTotal = pointsDetectes.reduce((acc, p) => acc + p.poids, 0)
  const scoreRisque = Math.max(0, 100 - poidsTotal)

  const niveauRisque: ResultatAnalyse['niveau_risque'] =
    scoreRisque >= 75 ? 'faible' :
    scoreRisque >= 50 ? 'modere' :
    scoreRisque >= 30 ? 'eleve' : 'critique'

  // Résumé
  const nbPoints = pointsDetectes.length
  let resume = ''
  if (nbPoints === 0) {
    resume = 'Aucun point sensible majeur détecté. Ce contrat semble équilibré sur les critères analysés.'
  } else if (niveauRisque === 'critique') {
    resume = `Attention : ${nbPoints} point(s) sensible(s) critique(s) détecté(s). Ce contrat présente des clauses qui pourraient vous exposer à des risques significatifs.`
  } else if (niveauRisque === 'eleve') {
    resume = `${nbPoints} point(s) sensible(s) détecté(s) dont certains à risque élevé. Une révision juridique est recommandée.`
  } else {
    resume = `${nbPoints} point(s) sensible(s) détecté(s) à risque modéré. Quelques clauses méritent attention avant signature.`
  }

  return {
    score_risque: scoreRisque,
    niveau_risque: niveauRisque,
    resume,
    points_sensibles: pointsDetectes,
    recommandations: [...new Set(recommandations)],
  }
}
