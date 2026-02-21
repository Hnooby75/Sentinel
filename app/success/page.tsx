// ============================================
// app/success/page.tsx
// Page de succès après paiement Stripe
// ============================================
import Link from 'next/link'
import { CheckCircle, ArrowRight, Shield } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icone succès */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Paiement confirmé !
        </h1>
        <p className="text-slate-500 mb-8">
          Votre abonnement Sentinel est activé. Vous pouvez maintenant accéder
          à toutes les fonctionnalités de votre plan.
        </p>

        {/* Card info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Conformité AI Act activée</p>
              <p className="text-xs text-slate-500">Déclarez vos premiers usages IA dès maintenant</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
            <p>✓ Journaux d'usage IA illimités</p>
            <p>✓ Score de conformité automatique</p>
            <p>✓ Génération de rapports réglementaires</p>
            <p>✓ Facture envoyée par email</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full mb-3"
        >
          Accéder au dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-slate-400">
          Un email de confirmation vous a été envoyé.{' '}
          <Link href="/dashboard/parametres/abonnement" className="text-blue-600 hover:underline">
            Gérer mon abonnement
          </Link>
        </p>
      </div>
    </div>
  )
}
