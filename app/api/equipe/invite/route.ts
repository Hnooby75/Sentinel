// ============================================
// app/api/equipe/invite/route.ts
// Invitation de membre via Supabase Auth
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email('Email invalide'),
  prenom: z.string().min(1, 'Prénom requis').max(50),
  nom: z.string().min(1, 'Nom requis').max(50),
  role: z.enum(['admin', 'manager', 'employe', 'lecteur']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier que l'utilisateur est admin (admin client bypass RLS)
  const utilisateur = await getUtilisateur(user.id)

  if (!utilisateur || (utilisateur.role !== 'admin' && utilisateur.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const body = await request.json()
  const validation = InviteSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const { email, prenom, nom, role } = validation.data
  const adminClient = createAdminClient()
  const entreprise = utilisateur.entreprise as unknown as { nom: string } | null

  // Vérifier si l'email existe déjà dans l'organisation
  const { data: existing } = await adminClient
    .from('utilisateurs')
    .select('id')
    .eq('email', email)
    .eq('entreprise_id', utilisateur.entreprise_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Cet utilisateur est déjà membre de votre organisation' }, { status: 409 })
  }

  try {
    // Inviter l'utilisateur via Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        prenom,
        nom,
        entreprise_id: utilisateur.entreprise_id,
        role,
        entreprise_nom: entreprise?.nom,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    if (inviteError) {
      console.error('Erreur invitation Supabase:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // Pré-créer le profil utilisateur (sera mis à jour à la première connexion)
    if (inviteData?.user) {
      await adminClient.from('utilisateurs').upsert({
        id: inviteData.user.id,
        email,
        prenom,
        nom,
        role,
        entreprise_id: utilisateur.entreprise_id,
        actif: false, // Activé après acceptation
      }, { onConflict: 'id' })
    }

    // Log d'audit
    await adminClient.from('audit_logs').insert({
      entreprise_id: utilisateur.entreprise_id,
      utilisateur_id: user.id,
      action: 'equipe.invite',
      ressource_type: 'utilisateur',
      ressource_id: inviteData?.user?.id,
      apres: { email, role },
      succes: true,
    })

    return NextResponse.json({ message: `Invitation envoyée à ${email}` })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET — Liste des membres
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Admin client bypass RLS pour éviter récursion infinie sur utilisateurs
  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  const adminClient = createAdminClient()
  const { data: membres, error } = await adminClient
    .from('utilisateurs')
    .select('id, prenom, nom, email, role, actif, derniere_connexion, created_at')
    .eq('entreprise_id', utilisateur.entreprise_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: membres })
}
