// ============================================
// app/api/copilot/conversations/[id]/route.ts
// GET    — récupérer une conversation
// PATCH  — mettre à jour messages + titre
// DELETE — supprimer la conversation
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, utilisateur: null }
  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  return { user, utilisateur }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, utilisateur } = await getAuth()
  if (!user || !utilisateur) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('conversations_copilote')
    .select('*')
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .eq('utilisateur_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, utilisateur } = await getAuth()
  if (!user || !utilisateur) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, any> = {}
  if (body.messages !== undefined) updates.messages = body.messages
  if (body.titre !== undefined) updates.titre = body.titre

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('conversations_copilote')
    .update(updates)
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .eq('utilisateur_id', user.id)
    .select('id, titre, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { user, utilisateur } = await getAuth()
  if (!user || !utilisateur) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('conversations_copilote')
    .delete()
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .eq('utilisateur_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
