import Link from 'next/link'
import { Globe, Pencil, Zap, Search, Smartphone, Check } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient as createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_SERVICES } from '@/lib/tarifs'

async function getWebPrice() {
  try {
    const db = createAdminClient()
    const { data } = await db.from('site_settings').select('valeur').eq('cle', 'tarifs_services').single()
    if (data?.valeur && Array.isArray(data.valeur)) {
      const web = data.valeur.find((s: { id: string }) => s.id === 'web')
      if (web) return web
    }
  } catch { /* ignore */ }
  return DEFAULT_SERVICES.find(s => s.id === 'web')!
}

export const metadata: Metadata = {
  title: 'Site Web Géré — Sentinel',
  description: 'Votre site web professionnel créé et géré par Sentinel. Modifiez le contenu depuis votre dashboard. Hébergement France inclus.',
}

const steps = [
  {
    num: '01',
    title: 'On crée votre site',
    desc: 'Nos designers créent votre site professionnel en 48h. Design sur-mesure, mobile-first, SEO optimisé.',
  },
  {
    num: '02',
    title: 'Vous validez et contrôlez',
    desc: 'Revue complète ensemble. On intègre vos retours jusqu\'à votre satisfaction totale.',
  },
  {
    num: '03',
    title: 'Vous gérez depuis Sentinel',
    desc: 'Modifiez textes, images et pages depuis votre dashboard. Sans jamais toucher au code.',
  },
]

const features = [
  { icon: Globe, title: 'Hébergement France inclus', desc: 'Serveurs OVHcloud certifiés. 99,9% uptime garanti. SSL automatique.' },
  { icon: Pencil, title: 'CMS intégré', desc: 'Éditez votre contenu depuis votre dashboard Sentinel. Interface simple, pas de connaissance technique.' },
  { icon: Search, title: 'SEO technique optimisé', desc: 'Vitesse, balises meta, sitemap, schema.org. Tout est configuré dès le lancement.' },
  { icon: Smartphone, title: 'Mobile-first', desc: 'Votre site est parfait sur mobile, tablette et desktop. Testé sur 20 appareils.' },
  { icon: Zap, title: 'Core Web Vitals', desc: 'Scores Lighthouse > 90. Votre site charge en moins de 2 secondes.' },
  { icon: Check, title: 'Mises à jour illimitées', desc: 'Demandez autant de modifications que vous voulez. On les intègre dans les 48h.' },
]

export default async function WebPage() {
  const web = await getWebPrice()
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="text-xs px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/5 mb-6 inline-block">
          Site Web Géré
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
          On crée votre site.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Vous le gérez.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Un site web professionnel créé en 48h par nos designers, hébergé en France
          et modifiable depuis votre dashboard Sentinel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all"
          >
            Démarrer avec le pack Présence
          </Link>
          <Link
            href="/#pricing"
            className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Process steps */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">En 3 étapes simples</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  {s.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-black text-white text-center mb-12">Tout ce qui est inclus</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-white/15 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-8">Tarif Site Web Géré</p>
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-purple-500/5 p-10 max-w-sm mx-auto">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black text-white">{web.prix_creation ?? 499}€</span>
              <span className="text-slate-400 text-base">création</span>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              + <span className="text-white font-bold">{web.prix_mensuel}€/mois</span> hébergement & gestion
            </p>
            <p className="text-emerald-400 text-xs font-semibold mb-6">
              ✓ Frais création offerts si devis accepté dans les 7 jours
            </p>
            <ul className="space-y-2 text-left mb-8">
              {web.features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all text-center"
            >
              Commencer avec le Pack Présence
            </Link>
            <p className="text-xs text-slate-600 mt-3">Résiliation libre à tout moment</p>
          </div>
          <p className="text-sm text-slate-500 mt-8">
            Inclus dans tous les{' '}
            <Link href="/packs" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              packs complets
            </Link>{' '}
            dès 89€/mois
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-purple-500/5 p-12">
          <h2 className="text-3xl font-black text-white mb-4">Prêt pour votre nouveau site ?</h2>
          <p className="text-slate-400 mb-8">
            Disponible dès le Pack Présence à <strong className="text-white">89€/mois</strong> + {web.prix_creation ?? 499}€ création.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all"
            >
              Commencer maintenant
            </Link>
            <Link
              href="/packs"
              className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              Voir tous les packs
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-4">Sans engagement · Annulation libre</p>
        </div>
      </section>
    </div>
  )
}
