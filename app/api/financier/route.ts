// ============================================
// app/api/financier/route.ts
// Module 5 — Solidité financière : CRUD flux
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { calculerScoreGlobal, sauvegarderScoreGlobal } from '@/lib/scoring/global'
import { z } from 'zod'

const FluxSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}-01$/, 'Format YYYY-MM-01 requis'),
  ca_mensuel: z.number().min(0),
  charges_fixes: z.number().min(0),
  charges_variables: z.number().min(0),
  tresorerie: z.number(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { data: flux, error } = await supabase
    .from('flux_financiers')
    .select('*')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('mois', { ascending: false })
    .limit(24)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: flux })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: utilisateur } = await createAdminClient()
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = FluxSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.flatten() }, { status: 400 })
  }

  const { data: flux, error } = await supabase
    .from('flux_financiers')
    .upsert({
      ...validation.data,
      entreprise_id: utilisateur.entreprise_id,
      saisi_par: user.id,
    }, { onConflict: 'entreprise_id,mois' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admin = createAdminClient()
  await admin.from('audit_logs').insert({
    entreprise_id: utilisateur.entreprise_id,
    utilisateur_id: user.id,
    action: 'flux_financier.upsert',
    ressource_type: 'flux_financier',
    ressource_id: flux.id,
    apres: flux,
    succes: true,
  })

  // Recalculer scores globaux (non bloquant)
  calculerScoreGlobal(utilisateur.entreprise_id).then(async (result) => {
    await sauvegarderScoreGlobal(utilisateur.entreprise_id, result)
  }).catch(console.error)

  return NextResponse.json(flux, { status: 201 })
}
