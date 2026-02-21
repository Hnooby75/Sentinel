// ============================================
// app/cgu/page.tsx
// Conditions Générales d'Utilisation
// ============================================
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function CguPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900 text-lg">Sentinel</span>
          </Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Connexion</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-slate-500 text-sm mb-8">Dernière mise à jour : 1er janvier 2025</p>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8 prose prose-slate max-w-none">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Objet</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation
              de la plateforme Sentinel, service SaaS de conformité AI Act édité par Sentinel SAS,
              société par actions simplifiée au capital de 10 000€, immatriculée au RCS de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description du service</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sentinel est une plateforme de gestion de la conformité au Règlement européen sur
              l'Intelligence Artificielle (AI Act — Règlement (UE) 2024/1689). Elle permet aux
              entreprises de documenter leurs usages IA, calculer un score de conformité et générer
              des rapports réglementaires.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Accès au service</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              L'accès au service est réservé aux professionnels (B2B). La création d'un compte
              implique l'acceptation des présentes CGU. Un essai gratuit de 14 jours est proposé
              sans engagement ni carte bancaire requise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Obligations de l'utilisateur</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              L'utilisateur s'engage à fournir des informations exactes, à maintenir la confidentialité
              de ses identifiants, et à utiliser le service conformément aux lois applicables.
              Toute utilisation frauduleuse entraîne la résiliation immédiate du compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Tarification et facturation</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les tarifs sont affichés sur la page de pricing. L'abonnement est mensuel, reconductible
              tacitement, et résiliable à tout moment sans frais depuis l'interface. La facturation
              est gérée par Stripe, Inc.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Responsabilité</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sentinel fournit un outil d'aide à la conformité. Les informations et rapports générés
              ne constituent pas un conseil juridique. L'utilisateur reste seul responsable de sa
              conformité réglementaire. Sentinel n'est pas responsable des décisions prises sur
              la base des données de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Propriété intellectuelle</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              L'ensemble des éléments constituant la plateforme Sentinel (code, design, algorithmes,
              bases de données) sont la propriété exclusive de Sentinel SAS et sont protégés par
              le droit de la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Résiliation</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              L'utilisateur peut résilier son abonnement à tout moment. Les données sont conservées
              30 jours après résiliation, puis supprimées définitivement. Sentinel se réserve le
              droit de suspendre tout compte en cas de violation des CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Droit applicable</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la
              compétence exclusive des tribunaux de Paris.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
          <Link href="/confidentialite" className="hover:text-slate-600">Politique de confidentialité</Link>
          <span>·</span>
          <Link href="/mentions-legales" className="hover:text-slate-600">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
