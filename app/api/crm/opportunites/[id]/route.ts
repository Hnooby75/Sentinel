// ============================================
// app/api/crm/opportunites/[id]/route.ts
// PATCH: modifier étape, probabilité
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const PatchOpportuniteSchema = z.object({
  titre: z.string().min(1).max(300).optional(),
  etape: z.enum(['prospection', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu']).optional(),
  probabilite: z.number().min(0).max(100).optional(),
  montant_estime: z.number().positive().optional().nullable(),
  date_cloture_prevue: z.string().optional().nullable(),
  assigne_a: z.string().uuid().optional().nullable(),
  score_risque_ia: z.number().min(0).max(100).optional(),
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
  const validation = PatchOpportuniteSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('opportunites')
    .update(validation.data)
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ opportunite: data })
}
