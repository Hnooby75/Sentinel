// ============================================
// app/api/ai/alertes/route.ts
// GET: alertes non résolues (filtres: module, severite)
// PATCH: marquer lu / résolu
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const PatchSchema = z.object({
  id: z.string().uuid(),
  lu: z.boolean().optional(),
  resolu: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id
  const url = new URL(request.url)
  const module_ = url.searchParams.get('module')
  const severite = url.searchParams.get('severite')

  let query = db
    .from('ai_alerts')
    .select('*')
    .eq('entreprise_id', eid)
    .eq('resolu', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (module_) query = query.eq('module', module_)
  if (severite) query = query.eq('severite', severite)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alertes: data || [] })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = PatchSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const { id, lu, resolu } = validation.data
  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const update: Record<string, boolean> = {}
  if (lu !== undefined) update.lu = lu
  if (resolu !== undefined) update.resolu = resolu

  const { data, error } = await db
    .from('ai_alerts')
    .update(update)
    .eq('id', id)
    .eq('entreprise_id', eid)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alerte: data })
}
