// ============================================
// app/api/admin/marketing/agents/route.ts
// GET: liste agents
// POST: créer agent
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
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const db = createAdminClient()

  // Compter les missions actives par agent
  const [agentsRes, missionsRes] = await Promise.all([
    db.from('agents_sentinel').select('*').order('nom', { ascending: true }),
    db
      .from('marketing_missions')
      .select('agent_id')
      .eq('statut', 'active'),
  ])

  const agents = agentsRes.data || []
  const missions = missionsRes.data || []

  const missionsParAgent: Record<string, number> = {}
  missions.forEach(m => {
    if (m.agent_id) missionsParAgent[m.agent_id] = (missionsParAgent[m.agent_id] || 0) + 1
  })

  const result = agents.map(a => ({
    ...a,
    missions_actives: missionsParAgent[a.id] || 0,
  }))

  return NextResponse.json({ agents: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body = await request.json()
  const { prenom, nom, email, role, specialites, bio, photo_url } = body

  if (!prenom || !nom || !email || !role) {
    return NextResponse.json({ error: 'prenom, nom, email, role requis' }, { status: 400 })
  }

  const validRoles = ['agent_junior', 'agent_senior', 'manager', 'directeur']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role invalide' }, { status: 400 })
  }

  const db = createAdminClient()

  const { data, error } = await db
    .from('agents_sentinel')
    .insert({ prenom, nom, email, role, specialites: specialites || [], bio: bio || null, photo_url: photo_url || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ agent: data }, { status: 201 })
}
