// ============================================
// app/api/ai/classify/route.ts
// Feature 3 — Auto-Classification AI Act via Groq
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { CLASSIFY_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { ClassificationResult } from '@/lib/ai/types'
import { calculerScore } from '@/lib/scoring/engine'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const ClassifySchema = z.object({
  description: z.string().min(10, 'Description trop courte').max(5000),
  journal_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = ClassifySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { description, journal_id } = validation.data

  try {
    const rawText = await complete({
      model: MODELS.fast,
      system: CLASSIFY_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Analyse et classifie ce système IA selon l'AI Act :\n\n${description}` },
      ],
      max_tokens: 2048,
    })

    let result: ClassificationResult
    try {
      result = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
    }

    if (journal_id) {
      const adminClient = createAdminClient()
      await adminClient
        .from('journaux_usage_ia')
        .update({
          ai_classification: result,
          auto_classified: true,
          classification_confidence: result.confidence,
          operator_status: result.operator_status,
          ai_act_articles: result.ai_act_articles,
          required_documentation: result.required_documentation,
          auto_action_plan: result.action_plan,
          niveau_risque: mapRiskLevel(result.risk_level),
        })
        .eq('id', journal_id)
        .eq('entreprise_id', utilisateur.entreprise_id)

      await adminClient.from('audit_logs').insert({
        entreprise_id: utilisateur.entreprise_id,
        utilisateur_id: user.id,
        action: 'ai.classify',
        ressource_type: 'journal_usage_ia',
        ressource_id: journal_id,
        apres: { classification: result.risk_level, confidence: result.confidence },
        succes: true,
      })

      // Recalculer les scores après classification
      const eid = utilisateur.entreprise_id
      Promise.all([
        calculerScore(eid).then(async (scoreResult) => {
          await adminClient.from('scores_conformite').insert({
            entreprise_id: eid,
            ...scoreResult,
          })
        }),
        calculerScoreGlobal(eid).then(async (globalResult) => {
          await sauvegarderScoreGlobal(eid, globalResult)
        }),
      ]).catch(console.error)
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur IA'
    console.error('Erreur classification IA:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function mapRiskLevel(level: string): string {
  const map: Record<string, string> = {
    unacceptable: 'inacceptable',
    high: 'eleve',
    limited: 'limite',
    minimal: 'faible',
  }
  return map[level] || 'non_classe'
}
