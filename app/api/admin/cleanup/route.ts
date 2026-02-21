// ============================================
// app/api/admin/cleanup/route.ts
// Super admin : supprime les entreprises orphelines via RPC SQL
// ============================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const utilisateur = await getUtilisateur(user.id)
  if (utilisateur?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const db = createAdminClient()

  // Tenter d'abord via RPC (fonction SQL directe, le plus fiable)
  const { data: rpcResult, error: rpcError } = await db.rpc('cleanup_orphaned_entreprises')

  if (!rpcError && rpcResult !== null) {
    return NextResponse.json({ deleted: rpcResult, method: 'rpc' })
  }

  // Fallback : approche JavaScript si la fonction RPC n'est pas encore créée
  // Récupérer toutes les entreprises
  const { data: entreprises } = await db
    .from('entreprises')
    .select('id')
    .limit(9999)

  if (!entreprises || entreprises.length === 0) {
    return NextResponse.json({ deleted: 0, method: 'js', info: 'Aucune entreprise trouvée' })
  }

  // Récupérer tous les entreprise_id ayant au moins 1 utilisateur
  const { data: liens } = await db
    .from('utilisateurs')
    .select('entreprise_id')
    .not('entreprise_id', 'is', null)
    .limit(9999)

  const avecUtilisateurs = new Set((liens || []).map(u => u.entreprise_id))
  const orphelines = entreprises.filter(e => !avecUtilisateurs.has(e.id))

  if (orphelines.length === 0) {
    return NextResponse.json({ deleted: 0, method: 'js', info: 'Aucune orpheline trouvée' })
  }

  const ids = orphelines.map(e => e.id)
  let deleted = 0

  // Supprimer les dépendances d'abord
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    await Promise.allSettled([
      db.from('sites_clients').delete().in('entreprise_id', batch),
      db.from('journaux_usage_ia').delete().in('entreprise_id', batch),
      db.from('obligations').delete().in('entreprise_id', batch),
      db.from('flux_financiers').delete().in('entreprise_id', batch),
      db.from('scores_conformite').delete().in('entreprise_id', batch),
      db.from('scores_globaux').delete().in('entreprise_id', batch),
    ])
  }

  // Puis supprimer les entreprises
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100)
    const { error } = await db.from('entreprises').delete().in('id', batch)
    if (!error) deleted += batch.length
  }

  return NextResponse.json({ deleted, total_orphelines: orphelines.length, method: 'js' })
}
