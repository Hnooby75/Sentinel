// ============================================
// app/api/copilot/conversations/route.ts
// GET  — liste des 10 dernières conversations
// POST — créer une nouvelle conversation
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { data, error } = await admin
    .from('conversations_copilote')
    .select('id, titre, created_at, updated_at')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .eq('utilisateur_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = createAdminClient()
  const { data: utilisateur } = await admin
    .from('utilisateurs').select('entreprise_id').eq('id', user.id).single()
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const { data, error } = await admin
    .from('conversations_copilote')
    .insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      titre: 'Nouvelle conversation',
      messages: [],
    })
    .select('id, titre, messages, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
