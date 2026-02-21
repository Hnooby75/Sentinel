// ============================================
// app/api/marketing/messages/route.ts
// GET: messages chat marketing
// POST: envoyer un message
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const { data: messages, error } = await db
    .from('messages_marketing')
    .select('id, content, is_from_agent, lu, created_at, sender_id')
    .eq('entreprise_id', eid)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Marquer les messages de l'agent comme lus
  await db
    .from('messages_marketing')
    .update({ lu: true })
    .eq('entreprise_id', eid)
    .eq('is_from_agent', true)
    .eq('lu', false)

  return NextResponse.json({ messages: messages || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const content = (body.content || '').trim()
  if (!content) return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Message trop long' }, { status: 400 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  // Trouver la mission active
  const { data: mission } = await db
    .from('marketing_missions')
    .select('id')
    .eq('entreprise_id', eid)
    .eq('statut', 'active')
    .single()

  const { data, error } = await db
    .from('messages_marketing')
    .insert({
      entreprise_id: eid,
      mission_id: mission?.id ?? null,
      sender_id: user.id,
      content,
      is_from_agent: false,
      lu: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data }, { status: 201 })
}
