// ============================================
// app/api/crm/leads/[id]/route.ts
// PATCH: modifier statut, notes d'un lead
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const PatchLeadSchema = z.object({
  statut: z.enum(['nouveau', 'contacte', 'qualifie', 'disqualifie']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  assigne_a: z.string().uuid().optional().nullable(),
  score_ia: z.number().min(0).max(100).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = PatchLeadSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('leads')
    .update(validation.data)
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}
