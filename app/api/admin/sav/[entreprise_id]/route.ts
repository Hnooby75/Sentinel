// ============================================
// app/api/admin/sav/[entreprise_id]/route.ts
// GET: conversation d'une entreprise
// POST: répondre (message support)
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entreprise_id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { entreprise_id } = await params
  const db = createAdminClient()

  const { data: messages, error } = await db
    .from('messages_sav')
    .select('id, content, is_from_support, lu, created_at, sender_id')
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Marquer messages clients comme lus
  await db
    .from('messages_sav')
    .update({ lu: true })
    .eq('entreprise_id', entreprise_id)
    .eq('is_from_support', false)
    .eq('lu', false)

  return NextResponse.json({ messages: messages || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entreprise_id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { entreprise_id } = await params
  const body = await request.json()
  const content = (body.content || '').trim()
  if (!content) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

  const db = createAdminClient()

  const { data, error } = await db
    .from('messages_sav')
    .insert({
      entreprise_id,
      sender_id: user.id,
      content,
      is_from_support: true,
      lu: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
