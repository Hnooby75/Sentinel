// ============================================
// app/api/fiscal/analyse/route.ts
// Analyse fiscale IA — Claude Sonnet
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const entreprise = utilisateur.entreprise as { nom: string; plan: string; secteur?: string; taille?: string } | null

  // Récupération parallèle des données financières
  const [fluxRes, indicateursRes, entrepriseRes] = await Promise.all([
    db.from('flux_financiers')
      .select('type, montant, categorie, description, date_flux')
      .eq('entreprise_id', eid)
      .order('date_flux', { ascending: false })
      .limit(100),

    db.from('indicateurs_financiers')
      .select('score_solidite, niveau, runway_mois, tendance_ca, ratio_charges, chiffre_affaires, charges_totales, resultat_net')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db.from('entreprises')
      .select('secteur, secteur_activite, taille, forme_juridique')
      .eq('id', eid)
      .single(),
  ])

  const flux = fluxRes.data || []
  const indicateurs = indicateursRes.data
  const entrepriseInfo = entrepriseRes.data

  // Construction du prompt
  const totalCharges = flux.filter(f => f.type === 'charge').reduce((sum, f) => sum + (f.montant || 0), 0)
  const totalRecettes = flux.filter(f => f.type === 'recette').reduce((sum, f) => sum + (f.montant || 0), 0)
  const categoriesCharges = [...new Set(flux.filter(f => f.type === 'charge').map(f => f.categorie).filter(Boolean))]

  const prompt = `Tu es un expert-comptable et fiscaliste français spécialisé dans les PME.

Données de l'entreprise :
- Nom : ${entreprise?.nom || 'N/A'}
- Secteur : ${entrepriseInfo?.secteur || entrepriseInfo?.secteur_activite || 'Non précisé'}
- Taille : ${entrepriseInfo?.taille || 'PME'}
- Forme juridique : ${entrepriseInfo?.forme_juridique || 'Non précisée'}
- Plan Sentinel : ${entreprise?.plan || 'trial'}

Indicateurs financiers :
- Chiffre d'affaires : ${indicateurs?.chiffre_affaires ? indicateurs.chiffre_affaires.toLocaleString('fr-FR') + '€' : 'Non disponible'}
- Charges totales : ${indicateurs?.charges_totales ? indicateurs.charges_totales.toLocaleString('fr-FR') + '€' : totalCharges.toLocaleString('fr-FR') + '€ (estimé)'}
- Résultat net : ${indicateurs?.resultat_net ? indicateurs.resultat_net.toLocaleString('fr-FR') + '€' : 'Non disponible'}
- Runway : ${indicateurs?.runway_mois || 'N/A'} mois
- Tendance CA : ${indicateurs?.tendance_ca || 'N/A'}
- Score solidité : ${indicateurs?.score_solidite || 'N/A'}/100

Flux récents :
- Total recettes (6 mois) : ${totalRecettes.toLocaleString('fr-FR')}€
- Total charges (6 mois) : ${totalCharges.toLocaleString('fr-FR')}€
- Catégories de charges : ${categoriesCharges.join(', ') || 'Non catégorisées'}

Analyse fiscale demandée. Retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "recommandations": [
    {
      "titre": "string (ex: 'Crédit d'Impôt Recherche (CIR)')",
      "description": "string (explication actionnable en 2-3 phrases)",
      "economie_estimee": number (montant en euros, 0 si non estimable),
      "priorite": "haute" | "moyenne" | "faible"
    }
  ],
  "economies_estimees": number (total estimé en euros),
  "alertes": [
    {
      "libelle": "string (ex: 'Déclaration TVA mensuelle')",
      "date": "string (ex: '15 mars 2026')",
      "type": "tva" | "is" | "liasse" | "autre"
    }
  ],
  "simulateur": [
    {
      "scenario": "string (ex: 'Achat véhicule utilitaire 30 000€')",
      "economie_is": number (économie IS estimée en euros)
    }
  ]
}

Identifie 3 à 6 recommandations pertinentes (CIR, JEI, ZFU, déductions spécifiques, amortissements, charges sociales...).
Identifie 2 à 4 alertes calendrier fiscal pertinentes pour les 3 prochains mois.
Propose 2 à 3 scénarios simulateur.
Sois précis et actionnable. Ne mets PAS de markdown, uniquement du JSON pur.`

  try {
    const response = await complete({
      model: MODELS.smart,
      system: 'Tu es un expert fiscaliste français. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni backticks.',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    })

    // Parse le JSON
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(cleaned)

    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur analyse fiscale:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
