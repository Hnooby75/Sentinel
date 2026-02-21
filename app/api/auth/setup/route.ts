// ============================================
// app/api/auth/setup/route.ts
// Auto-création du profil utilisateur + entreprise
// Appelé automatiquement après chaque connexion
// ============================================
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Créer le profil via le client admin (bypass RLS)
  const admin = createAdminClient()

  // Vérifier si le profil existe déjà — admin client pour bypasser RLS
  // (avec le client user, RLS peut bloquer et retourner null → créer des entreprises en double)
  const { data: existing } = await admin
    .from('utilisateurs')
    .select('id')
    .eq('id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true, created: false })
  }

  // 1. Créer l'entreprise
  const { data: entreprise, error: eError } = await admin
    .from('entreprises')
    .insert({
      nom: user.user_metadata?.entreprise_nom || 'Mon entreprise',
      plan: 'trial',
      plan_actif: true,
      trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (eError || !entreprise) {
    console.error('Erreur création entreprise:', eError)
    return NextResponse.json({ error: 'Erreur création entreprise' }, { status: 500 })
  }

  // 2. Créer l'utilisateur lié
  const { error: uError } = await admin
    .from('utilisateurs')
    .insert({
      id: user.id,
      email: user.email,
      prenom: user.user_metadata?.prenom || '',
      nom: user.user_metadata?.nom || '',
      role: 'admin',
      entreprise_id: entreprise.id,
      actif: true,
    })

  if (uError) {
    console.error('Erreur création utilisateur:', uError)
    // Atomicité : supprimer l'entreprise orpheline
    await admin.from('entreprises').delete().eq('id', entreprise.id)
    return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 })
  }

  // 3. Persister entreprise_id dans user_metadata pour le middleware
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, entreprise_id: entreprise.id },
  })

  return NextResponse.json({ ok: true, created: true })
}
