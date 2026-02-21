// ============================================
// app/api/ai/scan-supplier/route.ts
// Feature 9 — Supplier Risk Scanner via Groq
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { complete, MODELS } from '@/lib/ai/anthropic'
import { SUPPLIER_SCAN_PROMPT } from '@/lib/ai/prompts'
import { SupplierScanResult } from '@/lib/ai/types'
import { z } from 'zod'

const ScanSchema = z.object({
  supplier_name: z.string().min(2).max(200),
  supplier_url: z.string().url().optional(),
  description: z.string().min(10).max(3000),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = ScanSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { supplier_name, supplier_url, description } = validation.data

  try {
    const userMessage = `
Analyse ce fournisseur pour évaluer ses risques IA :

Nom : ${supplier_name}
${supplier_url ? `URL : ${supplier_url}` : ''}
Description / informations disponibles :
${description}
`

    const rawText = await complete({
      model: MODELS.fast,
      system: SUPPLIER_SCAN_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 2048,
    })

    let result: SupplierScanResult
    try {
      result = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ error: 'Réponse IA invalide — réessayez' }, { status: 500 })
    }

    const adminClient = createAdminClient()
    const { data: assessment } = await adminClient
      .from('supplier_assessments')
      .insert({
        entreprise_id: utilisateur.entreprise_id,
        supplier_name,
        supplier_url: supplier_url || null,
        risk_score: result.risk_score,
        ai_usage_detected: result.ai_usage_detected,
        policy_analysis: result.policy_analysis,
        findings: result.findings,
        recommendations: result.recommendations,
        summary: result.summary,
        last_scanned_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    await adminClient.from('audit_logs').insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      action: 'supplier.scan',
      ressource_type: 'supplier_assessment',
      ressource_id: assessment?.id,
      apres: { supplier_name, risk_score: result.risk_score },
      succes: true,
    })

    return NextResponse.json({ ...result, id: assessment?.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur IA'
    console.error('Erreur scan fournisseur:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
