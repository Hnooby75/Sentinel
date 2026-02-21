// ============================================
// app/mentions-legales/page.tsx
// Mentions légales obligatoires
// ============================================
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function MentionsLegalesPage() {
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
        <h1 className="text-3xl font-black text-slate-900 mb-2">Mentions légales</h1>
        <p className="text-slate-500 text-sm mb-8">Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique</p>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Éditeur du site</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-1">
              <p><strong>Raison sociale :</strong> Sentinel SAS</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
              <p><strong>Capital social :</strong> 10 000€</p>
              <p><strong>Siège social :</strong> France</p>
              <p><strong>Email :</strong> <a href="mailto:contact@sentinel-compliance.fr" className="text-blue-600 hover:underline">contact@sentinel-compliance.fr</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Directeur de la publication</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Le directeur de la publication est le représentant légal de Sentinel SAS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Hébergement</h2>
            <div className="text-slate-600 text-sm leading-relaxed space-y-1">
              <p><strong>Hébergeur applicatif :</strong> Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis</p>
              <p><strong>Base de données :</strong> Supabase Inc., hébergé sur AWS Frankfurt (eu-central-1), Allemagne, Union Européenne</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Propriété intellectuelle</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              L'ensemble du contenu du site Sentinel (textes, graphiques, logos, icônes, images,
              clips audio/vidéo, téléchargements numériques, compilations de données et logiciels)
              est la propriété de Sentinel SAS ou de ses fournisseurs de contenu et est protégé
              par les lois françaises et internationales sur la propriété intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Cookies</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sentinel utilise des cookies strictement nécessaires au fonctionnement du service
              (session d'authentification). Aucun cookie de tracking tiers n'est utilisé sans
              consentement explicite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Limitation de responsabilité</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sentinel s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées
              sur le site. Cependant, Sentinel ne peut garantir l'exactitude, la précision ou
              l'exhaustivité des informations mises à disposition. Les informations fournies ne
              constituent pas un avis juridique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Droit applicable</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>

        <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
          <Link href="/cgu" className="hover:text-slate-600">CGU</Link>
          <span>·</span>
          <Link href="/confidentialite" className="hover:text-slate-600">Confidentialité</Link>
        </div>
      </div>
    </div>
  )
}
