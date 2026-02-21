// ============================================
// scripts/delete-all-users.mjs
// Supprime TOUS les comptes de la plateforme
// Usage: node scripts/delete-all-users.mjs
// ============================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kbbfajxdlctjrjppoksb.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmZhanhkbGN0anJqcHBva3NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM2MTk3MSwiZXhwIjoyMDg2OTM3OTcxfQ.2suCBGUN8LFQjt1q7Vo6TdBA1l-aTEpIuF2BgyS3U9w'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function deleteAll() {
  console.log('🔍 Récupération de tous les utilisateurs Auth...')

  // 1. Lister tous les utilisateurs Auth
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) { console.error('❌ Erreur liste users:', listErr.message); process.exit(1) }

  console.log(`📋 ${users.length} utilisateur(s) trouvé(s):`)
  users.forEach(u => console.log(`   - ${u.email} (${u.id})`))

  if (users.length === 0) {
    console.log('✅ Aucun utilisateur à supprimer.')
    return
  }

  // 2. Récupérer les entreprise_ids
  const userIds = users.map(u => u.id)
  const { data: utilisateurs } = await admin
    .from('utilisateurs')
    .select('id, entreprise_id, email')
    .in('id', userIds)

  const entrepriseIds = [...new Set(
    (utilisateurs || []).map(u => u.entreprise_id).filter(Boolean)
  )]
  console.log(`\n🏢 ${entrepriseIds.length} entreprise(s) associée(s)`)

  // 3. Supprimer les données en cascade par entreprise
  if (entrepriseIds.length > 0) {
    const tables = [
      'scores_conformite',
      'scores_globaux',
      'analyses_contrats',
      'documents_contrats',
      'paiements',
      'factures',
      'clients',
      'obligations',
      'flux_financiers',
      'indicateurs_financiers',
      'supplier_assessments',
      'journaux_usage_ia',
      'shadow_ai_detections',
      'rapports',
      'audit_logs',
      'equipe_invitations',
      'formation_progress',
      'training_completions',
    ]

    console.log('\n🗑️  Suppression des données...')
    for (const table of tables) {
      const { error } = await admin
        .from(table)
        .delete()
        .in('entreprise_id', entrepriseIds)

      if (error && !error.message.includes('schema cache')) {
        console.log(`   ⚠️  ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table}`)
      }
    }
  }

  // 4. Supprimer les utilisateurs de la table utilisateurs
  if (userIds.length > 0) {
    const { error } = await admin.from('utilisateurs').delete().in('id', userIds)
    console.log(`\n👤 Table utilisateurs: ${error ? '❌ ' + error.message : '✅ supprimés'}`)
  }

  // 5. Supprimer les entreprises
  if (entrepriseIds.length > 0) {
    const { error } = await admin.from('entreprises').delete().in('id', entrepriseIds)
    console.log(`🏢 Table entreprises: ${error ? '❌ ' + error.message : '✅ supprimées'}`)
  }

  // 6. Supprimer les comptes Auth
  console.log('\n🔐 Suppression des comptes Auth Supabase...')
  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    console.log(`   ${error ? '❌' : '✅'} ${user.email}: ${error ? error.message : 'supprimé'}`)
  }

  console.log('\n🎉 Suppression terminée. Vous pouvez vous réinscrire sur http://localhost:3000/register')
}

deleteAll().catch(console.error)
