// ============================================
// app/confidentialite/page.tsx
// Politique de confidentialité (RGPD)
// ============================================
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function ConfidentialitePage() {
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
        <h1 className="text-3xl font-black text-slate-900 mb-2">Politique de confidentialité</h1>
        <p className="text-slate-500 text-sm mb-8">Dernière mise à jour : 1er janvier 2025</p>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sentinel SAS, dont le siège social est situé en France, est responsable du traitement
              de vos données personnelles. Contact DPO : dpo@sentinel-compliance.fr
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Données collectées</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-2">
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Données d'identification : nom, prénom, adresse email professionnelle</li>
                <li>Données de l'entreprise : nom, SIRET, secteur d'activité</li>
                <li>Données d'usage : journaux d'utilisation IA déclarés par vos soins</li>
                <li>Données de navigation : logs de connexion, adresse IP (sécurité)</li>
                <li>Données de facturation : gérées exclusivement par Stripe</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Finalités et bases légales</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-2">
              <ul className="list-disc pl-5 space-y-1">
                <li>Exécution du contrat : fourniture du service Sentinel</li>
                <li>Obligation légale : facturation, comptabilité</li>
                <li>Intérêt légitime : sécurité du service, prévention des fraudes</li>
                <li>Consentement : communications marketing (opt-in)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Hébergement et sécurité</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Vos données sont hébergées sur les serveurs Supabase (Frankfurt, Allemagne, UE).
              Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256).
              L'isolation multi-tenant est garantie par Row Level Security PostgreSQL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Durée de conservation</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les données sont conservées pendant la durée du contrat, puis 30 jours après résiliation
              (période de grâce), puis supprimées définitivement. Les données de facturation sont
              conservées 10 ans (obligation légale).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Vos droits</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-2">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement (droit à l'oubli)</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition et de limitation</li>
              </ul>
              <p className="mt-2">
                Pour exercer vos droits : <a href="mailto:dpo@sentinel-compliance.fr" className="text-blue-600 hover:underline">dpo@sentinel-compliance.fr</a>
              </p>
              <p>
                Vous pouvez également déposer une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Sous-traitants</h2>
            <div className="text-slate-600 text-sm leading-relaxed">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-semibold text-slate-700">Sous-traitant</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Finalité</th>
                    <th className="text-left py-2 font-semibold text-slate-700">Localisation</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-slate-100">
                    <td className="py-2">Supabase</td>
                    <td className="py-2">Base de données & Auth</td>
                    <td className="py-2">Frankfurt, UE</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2">Stripe</td>
                    <td className="py-2">Paiements</td>
                    <td className="py-2">États-Unis (SCCs)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Vercel</td>
                    <td className="py-2">Hébergement applicatif</td>
                    <td className="py-2">UE (option)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
          <Link href="/cgu" className="hover:text-slate-600">CGU</Link>
          <span>·</span>
          <Link href="/mentions-legales" className="hover:text-slate-600">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
