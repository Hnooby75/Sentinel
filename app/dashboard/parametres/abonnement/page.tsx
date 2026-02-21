// ============================================
// app/dashboard/parametres/abonnement/page.tsx
// Gestion de l'abonnement Stripe
// ============================================
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { Shield, CreditCard, CheckCircle, AlertTriangle, ExternalLink, Zap } from 'lucide-react'

export default async function AbonnementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur) return null

  const entreprise = utilisateur.entreprise as any
  const isAdmin = ['admin', 'super_admin'].includes(utilisateur.role)

  const trialExpiresAt = entreprise?.trial_expires_at
    ? new Date(entreprise.trial_expires_at)
    : null
  const trialDaysLeft = trialExpiresAt
    ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const PLAN_LABELS: Record<string, { label: string; color: string; price: string }> = {
    trial: { label: 'Essai gratuit', color: 'text-amber-600', price: 'Gratuit' },
    starter: { label: 'Starter', color: 'text-blue-600', price: '79€/mois' },
    pro: { label: 'Pro', color: 'text-purple-600', price: '149€/mois' },
    enterprise: { label: 'Enterprise', color: 'text-slate-900', price: 'Sur devis' },
  }

  const planConfig = PLAN_LABELS[entreprise?.plan || 'trial']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonnement</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gérez votre plan et votre facturation</p>
      </div>

      {/* Plan actuel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Plan actuel</p>
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-black ${planConfig.color}`}>{planConfig.label}</h2>
              {entreprise?.plan_actif ? (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Actif
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  Inactif
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">{planConfig.price}</p>
          </div>
          <Shield className="w-8 h-8 text-slate-300" />
        </div>

        {/* Trial warning */}
        {entreprise?.plan === 'trial' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {trialDaysLeft > 0
                  ? `Votre essai gratuit expire dans ${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''}.`
                  : 'Votre essai gratuit a expiré.'
                }
                {' '}Souscrivez pour continuer à utiliser Sentinel.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fonctionnalités incluses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Fonctionnalités incluses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Journaux d\'usage IA illimités',
            'Score de conformité automatique',
            'Rapport AI Act simplifié',
            'Registre des traitements',
            'Gestion d\'équipe multi-rôles',
            'Isolation des données (RLS)',
            'Audit log complet',
            'Support email',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Gérer l'abonnement</h3>
          <div className="space-y-3">
            {entreprise?.plan === 'trial' || !entreprise?.plan_actif ? (
              <form action="/api/stripe/checkout" method="POST">
                <input type="hidden" name="plan" value="starter" />
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors w-full justify-center"
                >
                  <Zap className="w-4 h-4" />
                  Souscrire au plan Starter — 79€/mois
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Pour modifier ou annuler votre abonnement, contactez-nous.</span>
                <a
                  href="mailto:contact@sentinel-compliance.fr"
                  className="flex items-center gap-1 text-blue-600 hover:underline font-medium ml-auto"
                >
                  Contact <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Facturation sécurisée</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Les paiements sont gérés par Stripe. Vos informations bancaires ne sont jamais
            stockées sur nos serveurs. Factures disponibles directement depuis Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}
