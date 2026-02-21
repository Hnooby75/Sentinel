// ============================================
// app/pricing/page.tsx
// Page de tarification publique
// ============================================
import Link from 'next/link'
import { Check, Shield, Zap, Building2, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 79,
    description: 'Pour les PME qui débutent leur conformité AI Act',
    color: 'border-slate-200',
    badge: null,
    features: [
      'Jusqu\'à 5 utilisateurs',
      'Journaux d\'usage IA illimités',
      'Score de conformité automatique',
      'Rapport AI Act simplifié',
      'Registre des traitements',
      'Support email',
    ],
    cta: 'Commencer l\'essai gratuit',
    href: '/register',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'Pour les équipes avec plusieurs entités ou usages avancés',
    color: 'border-blue-500',
    badge: 'Recommandé',
    features: [
      'Jusqu\'à 25 utilisateurs',
      'Tout Starter +',
      'Export audit complet PDF',
      'Bilan de conformité détaillé',
      'Gestion des rôles avancée',
      'API access',
      'Support prioritaire',
    ],
    cta: 'Démarrer Pro',
    href: '/register?plan=pro',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'Pour les groupes et entreprises avec besoins spécifiques',
    color: 'border-slate-200',
    badge: null,
    features: [
      'Utilisateurs illimités',
      'Tout Pro +',
      'SSO / SAML',
      'SLA garanti 99.9%',
      'Onboarding dédié',
      'DPO consulting inclus',
      'Contrat sur-mesure',
    ],
    cta: 'Nous contacter',
    href: 'mailto:contact@sentinel-compliance.fr',
    highlighted: false,
  },
]

const FAQ = [
  {
    q: 'Qu\'est-ce que l\'AI Act ?',
    a: 'Le règlement européen sur l\'intelligence artificielle (AI Act) impose aux entreprises de documenter, classifier et gouverner leurs usages IA. En vigueur depuis août 2024, les obligations progressives s\'appliquent jusqu\'en 2027.',
  },
  {
    q: 'Puis-je tester gratuitement ?',
    a: 'Oui, 14 jours d\'essai gratuit sans carte bancaire. Vous accédez à toutes les fonctionnalités Starter pendant cette période.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont hébergées en Europe (Frankfurt), chiffrées au repos et en transit. Isolation complète par entreprise via Row Level Security PostgreSQL.',
  },
  {
    q: 'Comment fonctionne la facturation ?',
    a: 'Abonnement mensuel, résiliable à tout moment. La facturation est gérée par Stripe. Vous recevez une facture chaque mois.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900 text-lg">Sentinel</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="py-16 text-center px-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          14 jours d'essai gratuit · Sans carte bancaire
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">
          Conformité AI Act<br />
          <span className="text-blue-600">simple et accessible</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Documentez vos usages IA, obtenez votre score de conformité et générez
          des rapports prêts pour les audits réglementaires.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 ${plan.color} p-6 relative ${
                plan.highlighted ? 'shadow-lg shadow-blue-100' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  {plan.price ? (
                    <>
                      <span className="text-4xl font-black text-slate-900">{plan.price}€</span>
                      <span className="text-slate-400 text-sm">/mois</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-slate-900">Sur devis</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-700 text-white'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Garanties */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Données hébergées en Europe', desc: 'Frankfurt, chiffrées, isolées par entreprise' },
            { icon: Zap, title: 'Mise en conformité en 1 heure', desc: 'Déclarez vos premiers usages IA dès aujourd\'hui' },
            { icon: Building2, title: 'Sans engagement', desc: 'Résiliation en 1 clic, sans frais' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-4">
              <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Questions fréquentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="font-semibold text-slate-900 text-sm mb-2">{q}</p>
                <p className="text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">Sentinel</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/cgu" className="hover:text-slate-700">CGU</Link>
            <Link href="/confidentialite" className="hover:text-slate-700">Confidentialité</Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">Mentions légales</Link>
          </div>
          <p className="text-xs text-slate-400">© 2025 Sentinel. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
