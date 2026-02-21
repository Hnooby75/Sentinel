// ============================================
// lib/services/ai/crm.ts
// Service IA CRM — Pipeline & Prévisions ventes
// ============================================
import { createClient } from '@/lib/supabase/admin'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { CRM_ANALYSE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export interface AnalyseCRMResult {
  revenu_prevu_30j: number
  revenu_prevu_90j: number
  nb_deals_prevus: number
  taux_conversion_prevu: number
  deals_en_danger: Array<{ titre: string; montant: number; raison: string; score_risque: number }>
  recommandations: Array<{ priorite: string; action: string; impact_estime: string }>
  analyse_texte: string
}

export async function analyserCRM(entrepriseId: string): Promise<AnalyseCRMResult> {
  const db = createClient()
  const maintenant = new Date()
  const il_y_a_90j = new Date(maintenant)
  il_y_a_90j.setDate(il_y_a_90j.getDate() - 90)

  const [leadsRes, opportunitesRes, facturesRes] = await Promise.all([
    db
      .from('leads')
      .select('statut, source, score_ia, created_at')
      .eq('entreprise_id', entrepriseId)
      .order('created_at', { ascending: false })
      .limit(100),

    db
      .from('opportunites')
      .select('titre, montant_estime, probabilite, etape, date_cloture_prevue, score_risque_ia, created_at, updated_at')
      .eq('entreprise_id', entrepriseId)
      .not('etape', 'in', '(gagne,perdu)')
      .order('updated_at', { ascending: false }),

    // Historique conversions (factures payées = référence)
    db
      .from('factures')
      .select('montant_ttc, statut, date_echeance')
      .eq('entreprise_id', entrepriseId)
      .in('statut', ['payee', 'partielle'])
      .gte('date_echeance', il_y_a_90j.toISOString().split('T')[0])
      .limit(50),
  ])

  const leads = leadsRes.data || []
  const opportunites = opportunitesRes.data || []
  const factures = facturesRes.data || []

  const pipelineTotal = opportunites.reduce((s, o) => s + (Number(o.montant_estime) || 0), 0)
  const revenuHistorique90j = factures.reduce((s, f) => s + (Number(f.montant_ttc) || 0), 0)

  // Deals sans activité depuis 30j
  const il_y_a_30j = new Date(maintenant)
  il_y_a_30j.setDate(il_y_a_30j.getDate() - 30)
  const dealsInactifs = opportunites.filter(o =>
    new Date(o.updated_at) < il_y_a_30j && o.probabilite < 70
  )

  const contexteCRM = {
    pipeline: {
      total_opportunites: opportunites.length,
      montant_total: pipelineTotal,
      par_etape: opportunites.reduce((acc, o) => {
        if (!acc[o.etape]) acc[o.etape] = { nb: 0, montant: 0 }
        acc[o.etape].nb++
        acc[o.etape].montant += Number(o.montant_estime) || 0
        return acc
      }, {} as Record<string, { nb: number; montant: number }>),
    },
    deals_details: opportunites.slice(0, 20).map(o => ({
      titre: o.titre,
      montant: Number(o.montant_estime),
      probabilite: o.probabilite,
      etape: o.etape,
      date_cloture: o.date_cloture_prevue,
      jours_sans_activite: Math.floor(
        (maintenant.getTime() - new Date(o.updated_at).getTime()) / 86400000
      ),
    })),
    leads: {
      total: leads.length,
      par_statut: leads.reduce((acc, l) => {
        acc[l.statut] = (acc[l.statut] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      par_source: leads.reduce((acc, l) => {
        acc[l.source] = (acc[l.source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      score_moyen_ia: leads.filter(l => l.score_ia != null).length > 0
        ? Math.round(leads.filter(l => l.score_ia != null).reduce((s, l) => s + (l.score_ia || 0), 0) /
            leads.filter(l => l.score_ia != null).length)
        : null,
    },
    historique: {
      revenu_90j: revenuHistorique90j,
      nb_factures_payees: factures.length,
    },
    deals_inactifs_30j: dealsInactifs.length,
    date_analyse: maintenant.toISOString(),
  }

  const raw = await complete({
    model: MODELS.smart,
    system: CRM_ANALYSE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyse ce pipeline commercial :\n${JSON.stringify(contexteCRM, null, 2)}`,
      },
    ],
    max_tokens: 1500,
  })

  let result: AnalyseCRMResult
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    result = {
      revenu_prevu_30j: pipelineTotal * 0.3,
      revenu_prevu_90j: pipelineTotal * 0.7,
      nb_deals_prevus: Math.floor(opportunites.length * 0.4),
      taux_conversion_prevu: 35,
      deals_en_danger: [],
      recommandations: [],
      analyse_texte: raw.slice(0, 500),
    }
  }

  // Persistance
  await db.from('ai_sales_predictions').upsert({
    entreprise_id: entrepriseId,
    genere_a: maintenant.toISOString(),
    revenu_prevu_30j: result.revenu_prevu_30j,
    revenu_prevu_90j: result.revenu_prevu_90j,
    nb_deals_prevus: result.nb_deals_prevus,
    taux_conversion_prevu: result.taux_conversion_prevu,
    deals_en_danger: result.deals_en_danger,
    recommandations: result.recommandations,
    analyse_texte: result.analyse_texte,
  }, { onConflict: 'entreprise_id,genere_a' })

  // Alertes si deals en danger
  const dealsEnDanger70 = result.deals_en_danger.filter(d => d.score_risque > 70)
  if (dealsEnDanger70.length > 0) {
    const montantRisque = dealsEnDanger70.reduce((s, d) => s + d.montant, 0)
    await db.from('ai_alerts').insert({
      entreprise_id: entrepriseId,
      module: 'crm',
      severite: 'warning',
      titre: `${dealsEnDanger70.length} deal(s) en danger (${montantRisque.toLocaleString('fr-FR')} €)`,
      description: dealsEnDanger70.map(d => d.titre).join(', '),
      donnees: { deals: dealsEnDanger70 },
    })
  }

  return result
}

export async function scorerLead(
  lead: {
    id: string
    nom: string
    email?: string
    telephone?: string
    entreprise_nom?: string
    source: string
    notes?: string
  },
  entrepriseId: string
): Promise<{ score: number; facteurs: Record<string, unknown>; prochaine_action: string }> {
  const db = createClient()
  const maintenant = new Date()

  const raw = await complete({
    model: MODELS.fast,
    system: `Tu es un directeur commercial expert. Calcule le score d'un lead (0-100) et recommande la prochaine action.
Retourne UNIQUEMENT un JSON : {"score": <0-100>, "facteurs": {"completude_profil": <note>, "source_qualite": <note>, "signaux_interet": <note>}, "prochaine_action": "<action concrète en 1 phrase>"}`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          source: lead.source,
          a_email: !!lead.email,
          a_telephone: !!lead.telephone,
          a_entreprise: !!lead.entreprise_nom,
          a_notes: !!lead.notes,
          longueur_notes: lead.notes?.length || 0,
        }),
      },
    ],
    max_tokens: 200,
  })

  let parsed = { score: 50, facteurs: {}, prochaine_action: 'Contacter par email' }
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch { /* garde valeurs par défaut */ }

  // Persistance score
  await db.from('ai_lead_scores').upsert({
    lead_id: lead.id,
    entreprise_id: entrepriseId,
    calcule_a: maintenant.toISOString(),
    score: parsed.score,
    facteurs: parsed.facteurs,
    prochaine_action: parsed.prochaine_action,
  }, { onConflict: 'lead_id,calcule_a' })

  // Mise à jour score sur le lead
  await db.from('leads')
    .update({ score_ia: parsed.score })
    .eq('id', lead.id)

  return parsed
}
