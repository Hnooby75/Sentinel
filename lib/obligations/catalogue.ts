// ============================================
// lib/obligations/catalogue.ts
// Sélection automatique des obligations selon profil entreprise
// ============================================

export interface ObligationTemplate {
  code: string
  libelle: string
  echeance_mois?: number // mois courant + N mois (pour ponctuel)
}

/**
 * Sélectionne les codes d'obligations à générer selon le profil de l'entreprise
 */
export function selectionnerObligations(entreprise: {
  taille?: string
  secteur_activite?: string
  traite_donnees_perso?: boolean
}): string[] {
  const codes: string[] = []

  // Toutes les entreprises
  codes.push('IS_ANNUEL', 'LIASSE_FISCALE', 'AG_ANNUELLE', 'DEPOT_COMPTES')

  // Selon la taille
  const taille = entreprise.taille
  if (taille && ['1_5', '6_20', '21_50', '51_250', '250+'].includes(taille)) {
    // Toutes les tailles avec salariés
    if (taille !== '1_5') {
      codes.push('COTISATIONS_SOCIALES', 'DSN_MENSUELLE', 'DPAE', 'FORMATION_PROFESSIONNELLE')
    }
  }

  // TVA (par défaut mensuelle, à ajuster)
  codes.push('TVA_MENSUELLE')
  codes.push('ACOMPTE_IS_T1', 'ACOMPTE_IS_T2', 'ACOMPTE_IS_T3', 'ACOMPTE_IS_T4')

  // Secteur alimentaire
  const secteur = entreprise.secteur_activite?.toLowerCase() ?? ''
  if (secteur.includes('alimentaire') || secteur.includes('restaur') || secteur.includes('food')) {
    codes.push('CERTIFICATION_HYGIENE')
  }

  // Traitement de données personnelles → RGPD
  if (entreprise.traite_donnees_perso) {
    codes.push('REGISTRE_TRAITEMENTS', 'ANALYSE_IMPACT')
  }

  return [...new Set(codes)] // Dédoublonnage
}

/**
 * Calcule la date d'échéance pour une obligation selon sa fréquence et ses mois d'échéance
 */
export function calculerProchainEcheance(
  frequence: string,
  moisEcheance: number[] | null
): string | null {
  const now = new Date()
  const moisActuel = now.getMonth() + 1 // 1-12

  if (!moisEcheance || moisEcheance.length === 0) return null

  // Trouver le prochain mois d'échéance
  const prochainMois = moisEcheance.find(m => m >= moisActuel) ?? moisEcheance[0]
  const annee = prochainMois < moisActuel ? now.getFullYear() + 1 : now.getFullYear()

  // Dernier jour du mois
  const dernierJour = new Date(annee, prochainMois, 0).getDate()
  return `${annee}-${String(prochainMois).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`
}
