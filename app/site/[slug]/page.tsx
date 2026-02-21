// ============================================
// app/site/[slug]/page.tsx
// Affichage public du site web client
// ============================================
import { notFound } from 'next/navigation'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

interface Hero {
  titre: string
  sous_titre: string
  cta_label: string
  cta_href: string
  image_url: string
}

interface APropos {
  titre: string
  texte: string
  image_url: string
}

interface Service {
  id: string
  titre: string
  description: string
  icon: string
  prix: string
}

interface Temoignage {
  id: string
  nom: string
  poste: string
  texte: string
  note: number
}

interface Contact {
  email: string
  telephone: string
  adresse: string
}

interface Config {
  nom_site: string
  slug: string
  couleur: string
  publie: boolean
}

interface SiteContenu {
  hero: Hero
  a_propos: APropos
  services: Service[]
  temoignages: Temoignage[]
  contact: Contact
  config: Config
}

export default async function SiteClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = createAdminClient()

  // Récupérer tous les sites en ligne
  const { data: sites } = await db
    .from('sites_clients')
    .select('contenu, url, statut')
    .in('statut', ['en_ligne', 'publie'])

  if (!sites || sites.length === 0) {
    notFound()
  }

  // Chercher le site correspondant au slug
  const siteData = sites.find(s => {
    const contenu = s.contenu as SiteContenu | null
    // Vérifier si le slug correspond dans config.slug
    if (contenu?.config?.slug === slug) return true
    // Vérifier si l'URL correspond (peut être /site/slug ou juste slug)
    if (s.url === `/site/${slug}` || s.url === slug) return true
    return false
  })

  if (!siteData || !siteData.contenu) {
    notFound()
  }

  const contenu = siteData.contenu as SiteContenu
  const couleur = contenu.config?.couleur || '#3B82F6'

  return (
    <div className="min-h-screen bg-white" style={{ '--couleur-principale': couleur } as React.CSSProperties}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {contenu.hero?.image_url && (
            <img
              src={contenu.hero.image_url}
              alt="Hero"
              className="w-full max-w-4xl mx-auto mb-8 rounded-2xl shadow-2xl object-cover h-96"
            />
          )}
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            {contenu.hero?.titre || 'Bienvenue'}
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            {contenu.hero?.sous_titre || ''}
          </p>
          {contenu.hero?.cta_label && (
            <a
              href={contenu.hero.cta_href || '#contact'}
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg"
              style={{ backgroundColor: couleur }}
            >
              {contenu.hero.cta_label}
            </a>
          )}
        </div>
      </section>

      {/* À propos */}
      {contenu.a_propos && (
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {contenu.a_propos.image_url && (
                <img
                  src={contenu.a_propos.image_url}
                  alt="À propos"
                  className="rounded-2xl shadow-xl w-full"
                />
              )}
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">
                  {contenu.a_propos.titre || 'Qui sommes-nous ?'}
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-line">
                  {contenu.a_propos.texte || ''}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {contenu.services && contenu.services.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Nos Services</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {contenu.services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{service.titre}</h3>
                  <p className="text-slate-600 mb-4">{service.description}</p>
                  {service.prix && (
                    <p className="text-lg font-semibold" style={{ color: couleur }}>
                      {service.prix}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Témoignages */}
      {contenu.temoignages && contenu.temoignages.length > 0 && (
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Témoignages</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {contenu.temoignages.map((temoignage) => (
                <div
                  key={temoignage.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${i < temoignage.note ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">&quot;{temoignage.texte}&quot;</p>
                  <div>
                    <p className="font-semibold text-slate-900">{temoignage.nom}</p>
                    <p className="text-sm text-slate-600">{temoignage.poste}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contenu.contact && (
        <section id="contact" className="py-20 px-4 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">Contactez-nous</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {contenu.contact.email && (
                <div>
                  <p className="text-slate-400 mb-2">Email</p>
                  <a href={`mailto:${contenu.contact.email}`} className="text-white hover:underline">
                    {contenu.contact.email}
                  </a>
                </div>
              )}
              {contenu.contact.telephone && (
                <div>
                  <p className="text-slate-400 mb-2">Téléphone</p>
                  <a href={`tel:${contenu.contact.telephone}`} className="text-white hover:underline">
                    {contenu.contact.telephone}
                  </a>
                </div>
              )}
              {contenu.contact.adresse && (
                <div>
                  <p className="text-slate-400 mb-2">Adresse</p>
                  <p className="text-white">{contenu.contact.adresse}</p>
                </div>
              )}
            </div>
            <form className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                placeholder="Votre nom"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Votre email"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Votre message"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: couleur }}
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 text-center text-sm">
        <p>© {new Date().getFullYear()} {contenu.config?.nom_site || 'Mon Site'}. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
