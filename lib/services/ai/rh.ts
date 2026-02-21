// ============================================
// lib/services/ai/rh.ts
// Service IA RH — Santé équipe & Conformité
// ============================================
import { createClient } from '@/lib/supabase/admin'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { RH_ANALYSE_SYSTEM_PROMPT } from '@/lib/ai/prompts'

export interface AnalyseRHResult {
  score_sante_rh: number
  taux_absenteisme: number
  employes_surcharge: number
  contrats_a_renouveler: number
  risques: Array<{ type: string; description: string; employes_concernes: number }>
  recommandations: Array<{ priorite: string; action: string; delai: string }>
  analyse_texte: string
}

export async function analyserRH(entrepriseId: string): Promise<AnalyseRHResult> {
  const db = createClient()
  const maintenant = new Date()
  const il_y_a_90j = new Date(maintenant)
  il_y_a_90j.setDate(il_y_a_90j.getDate() - 90)
  const dans_60j = new Date(maintenant)
  dans_60j.setDate(dans_60j.getDate() + 60)

  const [employesRes, congesRes] = await Promise.all([
    db
      .from('employes')
      .select('id, prenom, nom, poste, departement, type_contrat, date_embauche, date_fin_contrat, statut')
      .eq('entreprise_id', entrepriseId)
      .eq('statut', 'actif'),

    db
      .from('conges')
      .select('employe_id, type, date_debut, date_fin, statut')
      .eq('entreprise_id', entrepriseId)
      .gte('date_debut', il_y_a_90j.toISOString().split('T')[0])
      .in('statut', ['approuve', 'demande']),
  ])

  const employes = employesRes.data || []
  const conges = congesRes.data || []
  const nbEmployes = employes.length

  // Calcul taux absentéisme en TS (jours maladie / jours théoriques)
  const congesMaladie = conges.filter(c => c.type === 'maladie')
  const totalJoursMaladie = congesMaladie.reduce((s, c) => {
    const debut = new Date(c.date_debut)
    const fin = new Date(c.date_fin)
    return s + Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / 86400000))
  }, 0)
  const joursTheoriques = nbEmployes * 65 // ~65 jours ouvrés sur 90j
  const tauxAbsenteisme = joursTheoriques > 0
    ? Math.round((totalJoursMaladie / joursTheoriques) * 1000) / 10
    : 0

  // CDD expirant dans 60j
  const cddExpirant = employes.filter(e => {
    if (e.type_contrat !== 'cdd' && e.type_contrat !== 'stage' && e.type_contrat !== 'alternance') return false
    if (!e.date_fin_contrat) return false
    const fin = new Date(e.date_fin_contrat)
    return fin <= dans_60j && fin >= maintenant
  })

  const contexteRH = {
    effectif_total: nbEmployes,
    repartition_contrats: employes.reduce((acc, e) => {
      acc[e.type_contrat] = (acc[e.type_contrat] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    repartition_departements: employes.reduce((acc, e) => {
      const dept = e.departement || 'Non renseigné'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    taux_absenteisme_calcule: tauxAbsenteisme,
    conges_90j: {
      total: conges.length,
      maladie: congesMaladie.length,
      jours_maladie: totalJoursMaladie,
      cp: conges.filter(c => c.type === 'cp').length,
      rtt: conges.filter(c => c.type === 'rtt').length,
    },
    cdd_expirant_60j: cddExpirant.map(e => ({
      poste: e.poste,
      type: e.type_contrat,
      date_fin: e.date_fin_contrat,
    })),
    date_analyse: maintenant.toISOString(),
  }

  const raw = await complete({
    model: MODELS.fast,
    system: RH_ANALYSE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyse ces données RH :\n${JSON.stringify(contexteRH, null, 2)}`,
      },
    ],
    max_tokens: 1200,
  })

  let result: AnalyseRHResult
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    result = JSON.parse(cleaned)
  } catch {
    result = {
      score_sante_rh: 60,
      taux_absenteisme: tauxAbsenteisme,
      employes_surcharge: 0,
      contrats_a_renouveler: cddExpirant.length,
      risques: [],
      recommandations: [],
      analyse_texte: raw.slice(0, 500),
    }
  }

  // Persistance rapport
  await db.from('ai_hr_reports').upsert({
    entreprise_id: entrepriseId,
    genere_a: maintenant.toISOString(),
    score_sante_rh: result.score_sante_rh,
    taux_absenteisme: result.taux_absenteisme,
    employes_surcharge: result.employes_surcharge,
    contrats_a_renouveler: result.contrats_a_renouveler,
    risques: result.risques,
    recommandations: result.recommandations,
    analyse_texte: result.analyse_texte,
  }, { onConflict: 'entreprise_id,genere_a' })

  // Alertes critiques
  const risquesCritiques = result.risques.filter(r =>
    r.type?.toLowerCase().includes('legal') ||
    r.type?.toLowerCase().includes('burnout') ||
    r.type?.toLowerCase().includes('turnover')
  )
  if (risquesCritiques.length > 0 || cddExpirant.length >= 3) {
    await db.from('ai_alerts').insert({
      entreprise_id: entrepriseId,
      module: 'rh',
      severite: risquesCritiques.length > 0 ? 'critical' : 'warning',
      titre: risquesCritiques.length > 0
        ? `Risque RH critique : ${risquesCritiques[0].type}`
        : `${cddExpirant.length} contrats expirent dans 60 jours`,
      description: result.analyse_texte?.slice(0, 300) || '',
      donnees: {
        score_sante_rh: result.score_sante_rh,
        contrats_a_renouveler: result.contrats_a_renouveler,
      },
    })
  }

  return result
}

export async function calculerScoreSanteEmploye(
  employeId: string,
  entrepriseId: string
): Promise<{ score: number; facteurs: Record<string, unknown>; risque_turnover: string }> {
  const db = createClient()
  const maintenant = new Date()
  const il_y_a_6_mois = new Date(maintenant)
  il_y_a_6_mois.setMonth(il_y_a_6_mois.getMonth() - 6)

  const [employeRes, congesRes] = await Promise.all([
    db.from('employes').select('*').eq('id', employeId).single(),
    db
      .from('conges')
      .select('type, date_debut, date_fin, statut')
      .eq('employe_id', employeId)
      .gte('date_debut', il_y_a_6_mois.toISOString().split('T')[0]),
  ])

  const employe = employeRes.data
  const congesEmploye = congesRes.data || []

  const raw = await complete({
    model: MODELS.fast,
    system: `Tu es un DRH expert. Calcule le score de santé d'un employé (0-100) et son risque de turnover.
Retourne UNIQUEMENT un JSON : {"score": <0-100>, "facteurs": {"anciennete": <note>, "absenteisme": <note>, "stabilite_contrat": <note>}, "risque_turnover": "faible" | "moyen" | "eleve"}`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          poste: employe?.poste,
          type_contrat: employe?.type_contrat,
          date_embauche: employe?.date_embauche,
          date_fin_contrat: employe?.date_fin_contrat,
          conges_6_mois: congesEmploye.length,
          jours_maladie_6_mois: congesEmploye
            .filter(c => c.type === 'maladie')
            .reduce((s, c) => {
              const debut = new Date(c.date_debut)
              const fin = new Date(c.date_fin)
              return s + Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / 86400000))
            }, 0),
        }),
      },
    ],
    max_tokens: 200,
  })

  let parsed = { score: 70, facteurs: {}, risque_turnover: 'moyen' }
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch { /* garde valeurs par défaut */ }

  await db.from('ai_employee_health_score').upsert({
    employe_id: employeId,
    entreprise_id: entrepriseId,
    calcule_a: maintenant.toISOString(),
    score: parsed.score,
    facteurs: parsed.facteurs,
    risque_turnover: parsed.risque_turnover,
  }, { onConflict: 'employe_id,calcule_a' })

  return parsed
}
