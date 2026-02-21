// ============================================
// app/api/admin/clients/route.ts
// Super admin : liste de tous les comptes clients
// ============================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (utilisateur?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const db = createAdminClient()

  const { data: entreprises } = await db
    .from('entreprises')
    .select('id, nom, plan, plan_actif, trial_expires_at, created_at, secteur, taille')
    .order('created_at', { ascending: false })
    .limit(500)

  if (!entreprises) return NextResponse.json({ clients: [] })

  // Récupérer les utilisateurs par entreprise (limité pour éviter le cap Supabase 1000)
  const { data: utilisateurs } = await db
    .from('utilisateurs')
    .select('id, email, role, entreprise_id, actif')
    .eq('actif', true)
    .limit(2000)

  // Récupérer les sites clients
  const { data: sites } = await db
    .from('sites_clients')
    .select('entreprise_id, statut, url')

  const clients = entreprises.map(e => ({
    ...e,
    nb_utilisateurs: (utilisateurs || []).filter(u => u.entreprise_id === e.id).length,
    admin_email: (utilisateurs || []).find(u => u.entreprise_id === e.id && u.role === 'admin')?.email || '',
    site: (sites || []).find(s => s.entreprise_id === e.id) || null,
    trial_expire: e.trial_expires_at ? new Date(e.trial_expires_at) < new Date() : false,
  }))

  return NextResponse.json({ clients })
}
