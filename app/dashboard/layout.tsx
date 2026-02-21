// ============================================
// app/dashboard/layout.tsx
// Shell du dashboard — sidebar + contenu principal
// ============================================
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/dashboard/Sidebar'
import FloatingCopilot from '@/components/copilot/FloatingCopilot'
import NPSModal from '@/components/dashboard/NPSModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: utilisateur } = await supabase
    .from('utilisateurs')
    .select(`
      id, prenom, nom, role, email, entreprise_id,
      entreprise:entreprises(id, nom, plan, plan_actif, trial_expires_at)
    `)
    .eq('id', user.id)
    .single()

  // Premier accès : créer automatiquement le profil + entreprise
  if (!utilisateur) {
    try {
      const admin = createAdminClient()

      const { data: entreprise, error: errEnt } = await admin
        .from('entreprises')
        .insert({
          nom: user.user_metadata?.entreprise_nom || 'Mon entreprise',
          plan: 'trial',
          plan_actif: true,
          trial_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single()

      if (!errEnt && entreprise) {
        await admin
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

        // Re-lire après création
        const { data: newUtilisateur } = await admin
          .from('utilisateurs')
          .select(`
            id, prenom, nom, role, email, entreprise_id,
            entreprise:entreprises(id, nom, plan, plan_actif, trial_expires_at)
          `)
          .eq('id', user.id)
          .maybeSingle()

        utilisateur = newUtilisateur
      }
    } catch {
      // Si la création échoue, on redirige vers login plutôt que de crasher
    }
  }

  if (!utilisateur) redirect('/login')

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar utilisateur={utilisateur} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 pt-16 md:pt-6 min-h-full page-enter">
          {children}
        </div>
      </main>
      <FloatingCopilot />
      {(['starter', 'pro', 'enterprise'].includes((utilisateur?.entreprise as any)?.plan || '')) && (
        <NPSModal />
      )}
    </div>
  )
}
