// ============================================
// app/api/admin/sav/tickets/route.ts
// API tickets SAV côté super_admin
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const utilisateur = await getUtilisateur(user.id)
  if (utilisateur?.role !== 'super_admin') return null
  return utilisateur
}

export async function GET() {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('tickets_sav')
    .select(`
      id, sujet, categorie, description, statut, notes_admin, created_at, updated_at,
      entreprises(nom)
    `)
    .order('categorie', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data || [] })
}

export async function PATCH(request: NextRequest) {
  const admin = await checkSuperAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.statut      !== undefined) updates.statut      = body.statut
  if (body.notes_admin !== undefined) updates.notes_admin = body.notes_admin

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucune donnée à mettre à jour' }, { status: 400 })
  }

  const db = createAdminClient()
  const { error } = await db
    .from('tickets_sav')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
