// ============================================
// app/api/admin/delete-all-users/route.ts
// Suppression de TOUS les comptes utilisateurs
// POST /api/admin/delete-all-users  { confirm: "DELETE_ALL" }
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  // Sécurité — confirmation explicite requise
  if (body.confirm !== 'DELETE_ALL') {
    return NextResponse.json(
      { error: 'Confirmation requise : envoyez { "confirm": "DELETE_ALL" }' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // 1. Lister tous les utilisateurs Supabase Auth
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (listErr) {
    return NextResponse.json({ error: `Erreur listage: ${listErr.message}` }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ success: true, message: 'Aucun utilisateur à supprimer', deleted: 0 })
  }

  // 2. Supprimer les données liées en cascade via entreprises
  //    (ON DELETE CASCADE doit être configuré sur les FK en BDD)
  //    On supprime d'abord les entreprises (entraîne cascade sur toutes les tables liées)
  const userIds = users.map(u => u.id)

  // Récupérer toutes les entreprises_id liées à ces utilisateurs
  const { data: utilisateurs } = await admin
    .from('utilisateurs')
    .select('entreprise_id')
    .in('id', userIds)

  const entrepriseIds = [...new Set(
    utilisateurs?.map(u => u.entreprise_id).filter(Boolean) ?? []
  )]

  // Supprimer les données de chaque entreprise (tables sans CASCADE)
  if (entrepriseIds.length > 0) {
    await Promise.allSettled([
      admin.from('factures').delete().in('entreprise_id', entrepriseIds),
      admin.from('clients').delete().in('entreprise_id', entrepriseIds),
      admin.from('documents_contrats').delete().in('entreprise_id', entrepriseIds),
      admin.from('obligations').delete().in('entreprise_id', entrepriseIds),
      admin.from('flux_financiers').delete().in('entreprise_id', entrepriseIds),
      admin.from('indicateurs_financiers').delete().in('entreprise_id', entrepriseIds),
      admin.from('supplier_assessments').delete().in('entreprise_id', entrepriseIds),
      admin.from('journaux_usage_ia').delete().in('entreprise_id', entrepriseIds),
      admin.from('shadow_ai_detections').delete().in('entreprise_id', entrepriseIds),
      admin.from('scores_conformite').delete().in('entreprise_id', entrepriseIds),
      admin.from('scores_globaux').delete().in('entreprise_id', entrepriseIds),
      admin.from('rapports').delete().in('entreprise_id', entrepriseIds),
      admin.from('audit_logs').delete().in('entreprise_id', entrepriseIds),
    ])
  }

  // Supprimer les utilisateurs de la table utilisateurs
  if (userIds.length > 0) {
    await admin.from('utilisateurs').delete().in('id', userIds)
  }

  // Supprimer les entreprises
  if (entrepriseIds.length > 0) {
    await admin.from('entreprises').delete().in('id', entrepriseIds)
  }

  // 3. Supprimer chaque compte Auth Supabase
  const deleteResults = await Promise.allSettled(
    users.map(u => admin.auth.admin.deleteUser(u.id))
  )

  const deleted = deleteResults.filter(r => r.status === 'fulfilled').length
  const failed = deleteResults.filter(r => r.status === 'rejected').length

  return NextResponse.json({
    success: true,
    message: `${deleted} compte(s) supprimé(s)${failed > 0 ? `, ${failed} échec(s)` : ''}`,
    deleted,
    failed,
    emails: users.map(u => u.email),
  })
}
