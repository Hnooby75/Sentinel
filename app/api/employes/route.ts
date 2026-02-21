// ============================================
// app/api/employes/route.ts
// GET: liste employés + score santé
// POST: créer employé
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const CreateEmployeSchema = z.object({
  prenom: z.string().min(1).max(100),
  nom: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  poste: z.string().max(200).optional().nullable(),
  departement: z.string().max(100).optional().nullable(),
  type_contrat: z.enum(['cdi', 'cdd', 'freelance', 'stage', 'alternance']).default('cdi'),
  date_embauche: z.string().optional().nullable(),
  date_fin_contrat: z.string().optional().nullable(),
  salaire_brut: z.number().positive().optional().nullable(),
  statut: z.enum(['actif', 'inactif', 'conge']).default('actif'),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const [employesRes, scoresRes] = await Promise.all([
    db
      .from('employes')
      .select('*')
      .eq('entreprise_id', eid)
      .order('nom', { ascending: true }),
    db
      .from('ai_employee_health_score')
      .select('employe_id, score, risque_turnover, calcule_a')
      .eq('entreprise_id', eid)
      .order('calcule_a', { ascending: false }),
  ])

  const employes = employesRes.data || []
  const scores = scoresRes.data || []

  // Join scores avec employés (garder le dernier score par employé)
  const scoreMap = new Map<string, (typeof scores)[0]>()
  scores.forEach(s => {
    if (!scoreMap.has(s.employe_id)) scoreMap.set(s.employe_id, s)
  })

  const result = employes.map(e => ({
    ...e,
    score_sante: scoreMap.get(e.id)?.score ?? null,
    risque_turnover: scoreMap.get(e.id)?.risque_turnover ?? null,
  }))

  return NextResponse.json({ employes: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const body = await request.json()
  const validation = CreateEmployeSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Données invalides', details: validation.error.issues }, { status: 400 })
  }

  const db = createAdminClient()
  const eid = utilisateur.entreprise_id

  const { data, error } = await db
    .from('employes')
    .insert({ ...validation.data, entreprise_id: eid })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employe: data }, { status: 201 })
}
