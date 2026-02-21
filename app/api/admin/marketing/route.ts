// ============================================
// app/api/admin/marketing/route.ts
// GET: toutes missions + stats globales
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
  const now = new Date()
  const moisDebut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [missionsRes, agentsRes, heuresRes] = await Promise.all([
    db
      .from('marketing_missions')
      .select(`
        id, statut, heures_allouees_par_mois, date_debut, updated_at,
        entreprise:entreprises(id, nom, plan),
        agent:agents_sentinel(id, prenom, nom, role, photo_url)
      `)
      .order('updated_at', { ascending: false }),
    db
      .from('agents_sentinel')
      .select('id, prenom, nom, role, actif')
      .eq('actif', true),
    db
      .from('heures_marketing')
      .select('mission_id, heures_utilisees')
      .gte('mois', moisDebut),
  ])

  const missions = missionsRes.data || []
  const agents = agentsRes.data || []
  const heures = heuresRes.data || []

  const heuresMap: Record<string, number> = {}
  heures.forEach(h => {
    heuresMap[h.mission_id] = (heuresMap[h.mission_id] || 0) + h.heures_utilisees
  })

  const missionsAvecHeures = missions.map(m => ({
    ...m,
    heures_utilisees_ce_mois: heuresMap[m.id] || 0,
  }))

  const stats = {
    missions_actives: missions.filter(m => m.statut === 'active').length,
    total_agents: agents.length,
    heures_totales_ce_mois: heures.reduce((sum, h) => sum + h.heures_utilisees, 0),
  }

  return NextResponse.json({ missions: missionsAvecHeures, stats })
}
