// ============================================
// lib/scoring/impayes.ts
// Logique de scoring Module 2 — Impayés
// ============================================
import { createClient } from '@/lib/supabase/admin'

export interface ScoreImpayesResult {
  score: number
  niveau: 'critique' | 'risque' | 'attention' | 'solide'
  nb_clients: number
  nb_factures: number
  montant_total: number
  montant_a_risque: number
  taux_recouvrement: number
  detail: Record<string, any>
}

export async function calculerScoreImpayes(entrepriseId: string): Promise<ScoreImpayesResult> {
  const admin = createClient()

  const [{ data: factures }, { data: clients }] = await Promise.all([
    admin.from('factures')
      .select('*, paiements(*)')
      .eq('entreprise_id', entrepriseId),
    admin.from('clients')
      .select('id')
      .eq('entreprise_id', entrepriseId)
      .eq('actif', true),
  ])

  if (!factures || factures.length === 0) {
    return {
      score: 50, // Neutre si aucune facture
      niveau: 'attention',
      nb_clients: clients?.length ?? 0,
      nb_factures: 0,
      montant_total: 0,
      montant_a_risque: 0,
      taux_recouvrement: 100,
      detail: {},
    }
  }

  const now = new Date()
  let montantTotal = 0
  let montantImpaye = 0
  let montantRisque = 0

  for (const f of factures) {
    const montantFacture = Number(f.montant_ttc)
    montantTotal += montantFacture

    // Soustraire les paiements déjà reçus
    const paiementsCumules = (f.paiements || []).reduce(
      (acc: number, p: any) => acc + Number(p.montant), 0
    )
    const resteARegler = Math.max(0, montantFacture - paiementsCumules)

    if (['en_retard', 'contentieux', 'partielle'].includes(f.statut)) {
      montantImpaye += resteARegler
    }
    if (['en_retard', 'contentieux'].includes(f.statut)) {
      montantRisque += resteARegler
    }
  }

  const tauxRecouvrement = montantTotal > 0
    ? Math.round(((montantTotal - montantImpaye) / montantTotal) * 100)
    : 100

  // Score basé sur les scores de fiabilité clients pondérés par montant exposé
  const { data: scoresClients } = await admin
    .from('scores_fiabilite_client')
    .select('score, montant_total, montant_impaye')
    .eq('entreprise_id', entrepriseId)

  let scoreImpayes = 80 // Base
  if (scoresClients && scoresClients.length > 0) {
    const montantTotalClients = scoresClients.reduce((acc, s) => acc + Number(s.montant_total), 0)
    if (montantTotalClients > 0) {
      const scoresPonderes = scoresClients.reduce((acc, s) => {
        const poids = Number(s.montant_total) / montantTotalClients
        return acc + (s.score ?? 80) * poids
      }, 0)
      scoreImpayes = Math.round(scoresPonderes)
    }
  } else {
    // Calcul direct depuis factures si pas de scores clients calculés
    const facturesEnRetard = factures.filter(f => f.statut === 'en_retard').length
    const facturesContentieux = factures.filter(f => f.statut === 'contentieux').length
    scoreImpayes = Math.max(0, 80 - (facturesEnRetard * 10) - (facturesContentieux * 20))
  }

  scoreImpayes = Math.max(0, Math.min(100, scoreImpayes))

  const niveau: ScoreImpayesResult['niveau'] =
    scoreImpayes > 80 ? 'solide' :
    scoreImpayes >= 60 ? 'attention' :
    scoreImpayes >= 40 ? 'risque' : 'critique'

  return {
    score: scoreImpayes,
    niveau,
    nb_clients: clients?.length ?? 0,
    nb_factures: factures.length,
    montant_total: montantTotal,
    montant_a_risque: montantRisque,
    taux_recouvrement: tauxRecouvrement,
    detail: {
      factures_en_retard: factures.filter(f => f.statut === 'en_retard').length,
      factures_contentieux: factures.filter(f => f.statut === 'contentieux').length,
      factures_payees: factures.filter(f => f.statut === 'payee').length,
    },
  }
}

export function calculerScoreFiabiliteClient(params: {
  factures: Array<{
    statut: string
    date_echeance: string
    date_paiement?: string | null
    montant_ttc: number
  }>
}): number {
  let score = 80
  const { factures } = params

  if (factures.length === 0) return score

  for (const f of factures) {
    if (f.statut === 'contentieux') {
      score -= 40
      continue
    }
    if (f.statut === 'partielle') {
      score -= 10
      continue
    }
    if (f.date_paiement && f.date_echeance) {
      const echeance = new Date(f.date_echeance)
      const paiement = new Date(f.date_paiement)
      const diffJours = Math.round((paiement.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))
      if (diffJours > 30) score -= 20
      else if (diffJours > 0) score -= 10
      else if (diffJours < 0) score += 5 // Paiement anticipé
    } else if (f.statut === 'en_retard') {
      const echeance = new Date(f.date_echeance)
      const diffJours = Math.round((Date.now() - echeance.getTime()) / (1000 * 60 * 60 * 24))
      if (diffJours > 30) score -= 20
      else score -= 10
    }
  }

  // Bonus 12 mois sans retard
  const facturesRecentes = factures.filter(f => {
    const d = new Date(f.date_echeance)
    const il_y_a_12_mois = new Date()
    il_y_a_12_mois.setMonth(il_y_a_12_mois.getMonth() - 12)
    return d > il_y_a_12_mois
  })
  const sansRetard = facturesRecentes.every(
    f => f.statut === 'payee' && f.date_paiement &&
    new Date(f.date_paiement) <= new Date(f.date_echeance)
  )
  if (sansRetard && facturesRecentes.length > 0) score += 15

  return Math.max(0, Math.min(100, score))
}
