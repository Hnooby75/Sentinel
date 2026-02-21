// ============================================
// lib/services/ai/finance.ts
// Service IA Finance — Cashflow & Prévisions
// ============================================
import { createClient } from '@/lib/supabase/admin'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { FINANCE_ANALYSE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export interface AnalyseFinanceResult {
  prevision_30j: number
  prevision_60j: number
  prevision_90j: number
  tendance: string
  niveau_risque: string
  analyse_texte: string
  anomalies: Array<{ type: string; description: string; impact: string }>
  recommandations: Array<{ priorite: string; action: string; impact: string }>
}

export async function analyserFinance(entrepriseId: string): Promise<AnalyseFinanceResult> {
  const db = createClient()
  const maintenant = new Date()
  const il_y_a_3_mois = new Date(maintenant)
  il_y_a_3_mois.setMonth(il_y_a_3_mois.getMonth() - 3)

  // Récupération parallèle des données
  const [fluxRes, facturesRes, depensesRes] = await Promise.all([
    // Flux financiers 12 derniers mois
    db
      .from('flux_financiers')
      .select('mois, ca_mensuel, charges_fixes, charges_variables, tresorerie')
      .eq('entreprise_id', entrepriseId)
      .order('mois', { ascending: false })
      .limit(12),

    // Factures en retard
    db
      .from('factures')
      .select('montant_ttc, statut, date_echeance')
      .eq('entreprise_id', entrepriseId)
      .in('statut', ['en_retard', 'contentieux'])
      .limit(20),

    // Dépenses 3 derniers mois
    db
      .from('depenses')
      .select('libelle, montant, categorie, date_depense')
      .eq('entreprise_id', entrepriseId)
      .gte('date_depense', il_y_a_3_mois.toISOString().split('T')[0])
      .order('date_depense', { ascending: false })
      .limit(50),
  ])

  const flux = fluxRes.data || []
  const factures = facturesRes.data || []
  const depenses = depensesRes.data || []

  const montantImpaye = factures.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0)
  const totalDepenses3mois = depenses.reduce((s, d) => s + (Number(d.montant) || 0), 0)

  const contexteFinancier = {
    flux_12_mois: flux.map(f => ({
      mois: f.mois,
      ca: Number(f.ca_mensuel),
      charges: Number(f.charges_fixes) + Number(f.charges_variables),
      tresorerie: Number(f.tresorerie),
      marge: Number(f.ca_mensuel) - Number(f.charges_fixes) - Number(f.charges_variables),
    })),
    factures_en_retard: {
      nombre: factures.length,
      montant_total: montantImpaye,
    },
    depenses_3_mois: {
      total: totalDepenses3mois,
      nb_transactions: depenses.length,
      par_categorie: depenses.reduce((acc, d) => {
        const cat = d.categorie || 'autre'
        acc[cat] = (acc[cat] || 0) + Number(d.montant)
        return acc
      }, {} as Record<string, number>),
    },
    date_analyse: maintenant.toISOString(),
  }

  const raw = await complete({
    model: MODELS.smart,
    system: FINANCE_ANALYSE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyse ces données financières et génère les prévisions :\n${JSON.stringify(contexteFinancier, null, 2)}`,
      },
    ],
    max_tokens: 1500,
  })

  let result: AnalyseFinanceResult
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    result = {
      prevision_30j: flux[0] ? Number(flux[0].ca_mensuel) - Number(flux[0].charges_fixes) - Number(flux[0].charges_variables) : 0,
      prevision_60j: 0,
      prevision_90j: 0,
      tendance: 'stable',
      niveau_risque: 'modere',
      analyse_texte: raw.slice(0, 500),
      anomalies: [],
      recommandations: [],
    }
  }

  // Persistance
  await db.from('ai_cashflow_predictions').upsert({
    entreprise_id: entrepriseId,
    genere_a: maintenant.toISOString(),
    prevision_30j: result.prevision_30j,
    prevision_60j: result.prevision_60j,
    prevision_90j: result.prevision_90j,
    tendance: result.tendance,
    niveau_risque: result.niveau_risque,
    analyse_texte: result.analyse_texte,
    anomalies: result.anomalies,
    recommandations: result.recommandations,
  }, { onConflict: 'entreprise_id,genere_a' })

  // Alertes si risque élevé ou critique
  if (result.niveau_risque === 'eleve' || result.niveau_risque === 'critique') {
    await db.from('ai_alerts').insert({
      entreprise_id: entrepriseId,
      module: 'finance',
      severite: result.niveau_risque === 'critique' ? 'critical' : 'warning',
      titre: `Risque financier ${result.niveau_risque} détecté`,
      description: result.analyse_texte?.slice(0, 300) || 'Analyse financière IA',
      donnees: { niveau_risque: result.niveau_risque, prevision_30j: result.prevision_30j },
    })
  }

  return result
}

export async function categoriserDepense(
  libelle: string,
  montant: number
): Promise<{ categorie: string }> {
  const CATEGORIES = [
    'salaires', 'loyer', 'fournitures', 'marketing', 'informatique',
    'transport', 'formation', 'services_exterieurs', 'autre',
  ]

  const raw = await complete({
    model: MODELS.fast,
    system: `Tu es un comptable expert. Classe cette dépense dans l'une de ces catégories exactes : ${CATEGORIES.join(', ')}.
Retourne UNIQUEMENT le nom de la catégorie, rien d'autre.`,
    messages: [
      {
        role: 'user',
        content: `Libellé: "${libelle}", Montant: ${montant} €`,
      },
    ],
    max_tokens: 20,
  })

  const categorie = raw.trim().toLowerCase().replace(/[^a-z_]/g, '')
  return { categorie: CATEGORIES.includes(categorie) ? categorie : 'autre' }
}
