// ============================================
// app/api/ai/onboarding/route.ts
// Feature 12 — Onboarding IA 5 minutes via Groq
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { ONBOARDING_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { OnboardingResult } from '@/lib/ai/types'
import { z } from 'zod'

const OnboardingSchema = z.object({
  secteur: z.string().min(2),
  taille: z.enum(['1-9', '10-49', '50-249', '250+']),
  description_activite: z.string().min(20).max(2000),
  outils_utilises: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = OnboardingSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { secteur, taille, description_activite, outils_utilises } = validation.data
  const entreprise = utilisateur.entreprise as { nom: string } | null

  try {
    const userMessage = `
Analyse le profil de cette entreprise et génère un diagnostic initial AI Act.

Entreprise : ${entreprise?.nom}
Secteur : ${secteur}
Taille : ${taille} employés
Description de l'activité : ${description_activite}
${outils_utilises ? `Outils IA mentionnés : ${outils_utilises}` : ''}
`

    const rawText = await complete({
      model: MODELS.fast,
      system: ONBOARDING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 2048,
    })

    let result: OnboardingResult
    try {
      result = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
    }

    const adminClient = createAdminClient()
    await adminClient
      .from('entreprises')
      .update({ secteur, taille })
      .eq('id', utilisateur.entreprise_id)

    await adminClient.from('audit_logs').insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      action: 'ai.onboarding',
      ressource_type: 'entreprise',
      ressource_id: utilisateur.entreprise_id,
      apres: { secteur, taille, systemes_detectes: result.systemes_detectes?.length },
      succes: true,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur IA'
    console.error('Erreur onboarding IA:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
