// ============================================
// app/api/employes/[id]/route.ts
// PATCH: modifier un employé
// DELETE: supprimer un employé
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const PatchEmployeSchema = z.object({
  prenom: z.string().min(1).max(100).optional(),
  nom: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  poste: z.string().max(200).optional().nullable(),
  departement: z.string().max(100).optional().nullable(),
  type_contrat: z.enum(['cdi', 'cdd', 'freelance', 'stage', 'alternance']).optional(),
  date_embauche: z.string().optional().nullable(),
  date_fin_contrat: z.string().optional().nullable(),
  salaire_brut: z.number().positive().optional().nullable(),
  statut: z.enum(['actif', 'inactif', 'conge']).optional(),
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
  const validation = PatchEmployeSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('employes')
    .update(validation.data)
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employe: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const { error } = await db
    .from('employes')
    .delete()
    .eq('id', id)
    .eq('entreprise_id', utilisateur.entreprise_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
