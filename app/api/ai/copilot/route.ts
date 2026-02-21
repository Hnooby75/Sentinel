// ============================================
// app/api/ai/copilot/route.ts
// Copilote IA — accès complet à toutes les données
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { buildCopilotSystemPrompt, CopilotContext } from '@/lib/ai/prompts'
import { z } from 'zod'

const CopilotSchema = z.object({
  message: z.string().min(1).max(4000),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = CopilotSchema.safeParse(body)
  if (!validation.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { message } = validation.data
  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const entreprise = utilisateur.entreprise as { nom: string; plan: string; secteur?: string; taille?: string } | null

  // ─── Rate limiting trial (10 messages/jour) ──────────────────────────────
  if (entreprise?.plan === 'trial') {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count } = await db
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('entreprise_id', eid)
      .eq('module', 'copilot')
      .eq('action', 'message')
      .gte('created_at', todayStart.toISOString())
    if ((count || 0) >= 10) {
      return NextResponse.json({
        error: 'Limite atteinte : 10 messages par jour sur le plan Essai gratuit. Passez à un plan payant pour un accès illimité.',
      }, { status: 429 })
    }
    // Journaliser le message
    try {
      await db.from('activity_logs').insert({
        entreprise_id: eid,
        utilisateur_id: utilisateur.id,
        module: 'copilot',
        action: 'message',
        donnees: { preview: message.substring(0, 100) },
      })
    } catch (_) {}
  }

  // ─── Récupération parallèle de TOUTES les données ───────────────────────
  const [
    scoreIARes,
    journauxRes,
    scoreGlobalRes,
    obligationsRes,
    facturesRes,
    contratsRes,
    financierRes,
    fournisseursRes,
    membresRes,
    entrepriseRes,
    cashflowRes,
    hrReportRes,
    salesPredRes,
    alertesCopilotRes,
    opportunitesRes,
    employesRes,
  ] = await Promise.all([
    // Conformité IA Act
    db.from('scores_conformite')
      .select('score_global, niveau_conformite, score_documentation, score_classification, score_mitigation, score_gouvernance, recommandations')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Journaux IA (tous les actifs)
    db.from('journaux_usage_ia')
      .select('titre, outil_ia, categorie_usage, niveau_risque, statut, traite_donnees_perso, decision_automatisee')
      .eq('entreprise_id', eid)
      .neq('statut', 'archive')
      .order('niveau_risque', { ascending: true })
      .limit(50),

    // Score santé globale
    db.from('scores_globaux')
      .select('score_global, niveau, score_conformite_ia, score_impayes, score_obligations, score_contractuel, score_financier')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Obligations (toutes sauf non_applicable)
    db.from('obligations')
      .select('libelle_custom, statut, echeance')
      .eq('entreprise_id', eid)
      .neq('statut', 'non_applicable')
      .order('echeance', { ascending: true })
      .limit(30),

    // Factures problématiques
    db.from('factures')
      .select('montant_ttc, statut, date_echeance')
      .eq('entreprise_id', eid)
      .in('statut', ['en_retard', 'contentieux', 'envoyee', 'partielle'])
      .limit(50),

    // Analyses contrats
    db.from('analyses_contrats')
      .select('score_risque, niveau_risque')
      .eq('entreprise_id', eid)
      .limit(30),

    // Indicateurs financiers
    db.from('indicateurs_financiers')
      .select('score_solidite, niveau, runway_mois, tendance_ca, ratio_charges')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Fournisseurs IA
    db.from('supplier_assessments')
      .select('supplier_name, risk_score')
      .eq('entreprise_id', eid)
      .limit(30),

    // Membres équipe
    db.from('utilisateurs')
      .select('id')
      .eq('entreprise_id', eid)
      .eq('actif', true),

    // Infos entreprise (secteur, taille)
    db.from('entreprises')
      .select('secteur, secteur_activite, taille')
      .eq('id', eid)
      .single(),

    // Copilote Finance — dernière prédiction cashflow
    db.from('ai_cashflow_predictions')
      .select('prevision_30j, niveau_risque, tendance')
      .eq('entreprise_id', eid)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Copilote RH — dernier rapport
    db.from('ai_hr_reports')
      .select('score_sante_rh, taux_absenteisme, contrats_a_renouveler')
      .eq('entreprise_id', eid)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Copilote CRM — dernière prédiction ventes
    db.from('ai_sales_predictions')
      .select('revenu_prevu_30j, taux_conversion_prevu')
      .eq('entreprise_id', eid)
      .order('genere_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Alertes non résolues cross-modules
    db.from('ai_alerts')
      .select('severite')
      .eq('entreprise_id', eid)
      .eq('resolu', false),

    // Opportunités actives pour pipeline
    db.from('opportunites')
      .select('montant_estime, etape')
      .eq('entreprise_id', eid)
      .not('etape', 'in', '(gagne,perdu)'),

    // Effectif actif
    db.from('employes')
      .select('id')
      .eq('entreprise_id', eid)
      .eq('statut', 'actif'),
  ])

  // ─── Construction du contexte ────────────────────────────────────────────
  const scoreIA = scoreIARes.data
  const journaux = journauxRes.data || []
  const scoreGlobal = scoreGlobalRes.data
  const obligations = obligationsRes.data || []
  const factures = facturesRes.data || []
  const contrats = contratsRes.data || []
  const financier = financierRes.data
  const fournisseurs = fournisseursRes.data || []
  const entrepriseInfo = entrepriseRes.data
  const cashflowData = cashflowRes.data
  const hrReportData = hrReportRes.data
  const salesPredData = salesPredRes.data
  const alertesCopilot = alertesCopilotRes.data || []
  const opportunitesActives = opportunitesRes.data || []
  const employesActifs = employesRes.data || []

  // Calcul impayés
  const facturesEnRetard = factures.filter(f => f.statut === 'en_retard' || f.statut === 'contentieux')
  const montantEnRetard = facturesEnRetard.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)
  const facturesContentieux = factures.filter(f => f.statut === 'contentieux').length

  // Obligations par statut
  const obligRetard = obligations.filter(o => o.statut === 'en_retard')
  const obligAFaire = obligations.filter(o => o.statut === 'a_faire')
  const obligValidees = obligations.filter(o => o.statut === 'valide')
  const prochaines = [...obligRetard, ...obligAFaire]
    .filter(o => o.echeance)
    .sort((a, b) => new Date(a.echeance).getTime() - new Date(b.echeance).getTime())
    .slice(0, 5)

  // Contrats à risque
  const contratsAnalyses = contrats.filter(c => c.score_risque != null)
  const contratsCritique = contrats.filter(c => c.niveau_risque === 'critique').length
  const contratsEleve = contrats.filter(c => c.niveau_risque === 'eleve').length

  // Fournisseurs à risque (score < 50)
  const fournisseursARisque = fournisseurs.filter(f => (f.risk_score || 100) < 50).length

  const recos = (scoreIA?.recommandations as Array<{ titre: string; priorite: string; description?: string }>) || []

  const ctx: CopilotContext = {
    entreprise_nom: entreprise?.nom || 'Entreprise',
    secteur: entrepriseInfo?.secteur || entrepriseInfo?.secteur_activite || entreprise?.nom || '',
    taille: entrepriseInfo?.taille || '',
    plan: entreprise?.plan || 'trial',

    score_global: scoreGlobal?.score_global || scoreIA?.score_global || 0,
    niveau_global: scoreGlobal?.niveau || scoreIA?.niveau_conformite || 'critique',

    score_conformite: scoreIA?.score_global || 0,
    niveau_conformite: scoreIA?.niveau_conformite || 'critique',
    score_documentation: scoreIA?.score_documentation || 0,
    score_classification: scoreIA?.score_classification || 0,
    score_mitigation: scoreIA?.score_mitigation || 0,
    score_gouvernance: scoreIA?.score_gouvernance || 0,
    journaux,
    recommandations_ia: recos,

    obligations_total: obligations.length,
    obligations_en_retard: obligRetard.length,
    obligations_a_faire: obligAFaire.length,
    obligations_validees: obligValidees.length,
    prochaines_obligations: prochaines.map(o => ({
      libelle: o.libelle_custom || 'Obligation',
      echeance: o.echeance,
      statut: o.statut,
    })),

    factures_total: factures.length,
    factures_en_retard: facturesEnRetard.length,
    factures_contentieux: facturesContentieux,
    montant_en_retard: Math.round(montantEnRetard),

    contrats_total: contratsAnalyses.length,
    contrats_critique: contratsCritique,
    contrats_eleve: contratsEleve,

    runway_mois: financier?.runway_mois || 0,
    tendance_ca: financier?.tendance_ca || '',
    score_solidite: financier?.score_solidite || 0,
    ratio_charges: financier?.ratio_charges || 0,

    fournisseurs_total: fournisseurs.length,
    fournisseurs_a_risque: fournisseursARisque,

    nb_membres: membresRes.data?.length || 1,

    // Copilote Dirigeant — Finance IA
    cashflow_prevision_30j: cashflowData?.prevision_30j != null ? Number(cashflowData.prevision_30j) : null,
    cashflow_niveau_risque: cashflowData?.niveau_risque ?? null,
    cashflow_tendance: cashflowData?.tendance ?? null,

    // Copilote Dirigeant — RH IA
    rh_score_sante: hrReportData?.score_sante_rh ?? null,
    rh_nb_employes: employesActifs.length || null,
    rh_contrats_a_renouveler: hrReportData?.contrats_a_renouveler ?? null,
    rh_taux_absenteisme: hrReportData?.taux_absenteisme ?? null,

    // Copilote Dirigeant — CRM IA
    crm_pipeline_total: opportunitesActives.length > 0
      ? opportunitesActives.reduce((s, o) => s + (Number(o.montant_estime) || 0), 0)
      : null,
    crm_revenu_prevu_30j: salesPredData?.revenu_prevu_30j != null ? Number(salesPredData.revenu_prevu_30j) : null,
    crm_nb_deals_actifs: opportunitesActives.length || null,
    crm_taux_conversion: salesPredData?.taux_conversion_prevu ?? null,

    // Alertes cross-modules
    alertes_critiques: alertesCopilot.filter(a => a.severite === 'critical').length,
    alertes_warnings: alertesCopilot.filter(a => a.severite === 'warning').length,
  }

  const systemPrompt = buildCopilotSystemPrompt(ctx)

  // ─── Appel Groq ──────────────────────────────────────────────────────────
  try {
    const response = await complete({
      model: MODELS.smart,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      max_tokens: 2048,
    })

    return NextResponse.json({ response })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur copilot Groq:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
