// ============================================
// app/api/ai/generate-document/route.ts
// Feature 4 — Génération de documents de conformité via Groq
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { buildDocumentPrompt, DOC_TYPES } from '@/lib/ai/prompts'
import { z } from 'zod'

const GenerateDocSchema = z.object({
  doc_type: z.enum(['fria', 'risk_management', 'technical_doc', 'user_instructions', 'conformity_declaration', 'rgpd_notice']),
  journal_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = GenerateDocSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { doc_type, journal_id } = validation.data
  const adminClient = createAdminClient()

  const { data: journal, error } = await adminClient
    .from('journaux_usage_ia')
    .select('*')
    .eq('id', journal_id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .single()

  if (error || !journal) {
    return NextResponse.json({ error: 'Journal introuvable' }, { status: 404 })
  }

  try {
    const entreprise = utilisateur.entreprise as { nom: string } | null

    const systemData = {
      entreprise: entreprise?.nom,
      systeme_ia: journal.titre,
      outil_utilise: journal.outil_ia,
      categorie_usage: journal.categorie_usage,
      niveau_risque: journal.niveau_risque,
      description: journal.description,
      traite_donnees_perso: journal.traite_donnees_perso,
      types_donnees_perso: journal.types_donnees_perso,
      base_legale_rgpd: journal.base_legale_rgpd,
      decision_automatisee: journal.decision_automatisee,
      impact_personnes: journal.impact_personnes,
      date_premier_usage: journal.date_premier_usage,
      nb_utilisateurs_concernes: journal.nb_utilisateurs_concernes,
      classification: journal.ai_classification,
    }

    const content = await complete({
      model: MODELS.smart,
      messages: [{ role: 'user', content: buildDocumentPrompt(doc_type, systemData) }],
      max_tokens: 4096,
    })

    const { data: rapport } = await adminClient
      .from('rapports')
      .insert({
        entreprise_id: utilisateur.entreprise_id,
        genere_par: user.id,
        type: doc_type,
        titre: `${DOC_TYPES[doc_type]?.label} — ${journal.titre}`,
        contenu: { markdown: content, journal_id, doc_type },
        statut: 'genere',
      })
      .select('id')
      .single()

    await adminClient.from('audit_logs').insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      action: 'ai.generate_document',
      ressource_type: 'rapport',
      ressource_id: rapport?.id,
      apres: { doc_type, journal_id },
      succes: true,
    })

    return NextResponse.json({ content, rapport_id: rapport?.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur IA'
    console.error('Erreur génération document:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
