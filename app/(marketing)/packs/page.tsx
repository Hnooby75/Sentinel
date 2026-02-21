// ============================================
// app/(marketing)/packs/page.tsx
// Page packs complets — accessible via /packs et packs.sentinel.fr
// ============================================
import Link from 'next/link'
import { Check, Zap, Star } from 'lucide-react'
import type { Metadata } from 'next'
import { DEFAULT_PACKS, DEFAULT_SERVICES, type PackTarif, type ServiceTarif } from '@/lib/tarifs'
import { createClient as createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Packs & Tarifs — Sentinel',
  description: 'SaaS Panel + Site Web + Marketing dans des packs complets à partir de 89€/mois. Défiant toute concurrence.',
}

async function getPacks(): Promise<PackTarif[]> {
  try {
    const db = createAdminClient()
    const { data } = await db
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'tarifs_packs')
      .single()
    if (data?.valeur && Array.isArray(data.valeur)) return data.valeur
  } catch { /* ignore */ }
  return DEFAULT_PACKS
}

async function getServices(): Promise<ServiceTarif[]> {
  try {
    const db = createAdminClient()
    const { data } = await db
      .from('site_settings')
      .select('valeur')
      .eq('cle', 'tarifs_services')
      .single()
    if (data?.valeur && Array.isArray(data.valeur)) return data.valeur
  } catch { /* ignore */ }
  return DEFAULT_SERVICES
}

const COULEURS: Record<string, { border: string; bg: string; badge: string; btn: string }> = {
  presence:     { border: 'border-blue-500/30',   bg: 'from-blue-500/8 to-blue-500/3',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   btn: 'from-blue-500 to-blue-600' },
  croissance:   { border: 'border-cyan-500/50',    bg: 'from-cyan-500/12 to-blue-500/6',  badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',    btn: 'from-cyan-500 via-blue-500 to-purple-600' },
  acceleration: { border: 'border-purple-500/30',  bg: 'from-purple-500/8 to-purple-500/3', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', btn: 'from-purple-500 to-purple-600' },
  entreprise:   { border: 'border-amber-500/30',   bg: 'from-amber-500/8 to-amber-500/3',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',  btn: 'from-amber-500 to-orange-500' },
}

export default async function PacksPage() {
  const [packs, services] = await Promise.all([getPacks(), getServices()])

  // Prix de référence individuels pour le calcul d'économies
  const saas = services.find(s => s.id === 'saas')
  const web  = services.find(s => s.id === 'web')

  return (
    <div className="pt-24">
      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="text-xs px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-400 bg-cyan-500/5 mb-6 inline-block">
          Packs Complets — Tout inclus
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
          Un seul abonnement,{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            tout ce qu&apos;il faut
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
          SaaS Panel + Site Web + Marketing géré dans des packs pensés pour les PME.
          Zéro surprise, résiliation libre, remboursé si insatisfait sous 30j.
        </p>
        <p className="text-sm text-slate-500 max-w-xl mx-auto mb-10">
          Frais de création du site : <strong className="text-white">499€ unique</strong> · Inclus si devis accepté dans les 7 jours
        </p>

        {/* Ancres rapides */}
        <div className="flex flex-wrap gap-3 justify-center">
          {packs.map(p => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className={`text-xs px-4 py-2 rounded-full border transition-all hover:scale-105 ${
                p.popular
                  ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
                  : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
              }`}
            >
              {p.popular && '⭐ '}{p.nom}
            </a>
          ))}
        </div>
      </section>

      {/* ── Prix individuels de référence ── */}
      <section className="border-y border-white/5 bg-white/2 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-8 font-semibold">
            Prix si achetés séparément
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'SaaS Panel', prix: `${saas?.prix_mensuel ?? 49}€/mois`, lien: '/saas', couleur: 'text-cyan-400' },
              { label: 'Site Web Géré', prix: `${web?.prix_creation ?? 499}€ création + ${web?.prix_mensuel ?? 49}€/mois`, lien: '/web', couleur: 'text-blue-400' },
              { label: 'Marketing', prix: 'dès 249€/mois', lien: '/services-marketing', couleur: 'text-purple-400' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.lien}
                className="rounded-xl border border-white/8 bg-white/3 p-4 text-center hover:border-white/15 transition-all group"
              >
                <p className={`text-lg font-black ${item.couleur} mb-1`}>{item.prix}</p>
                <p className="text-sm text-slate-400 group-hover:text-white transition-colors">{item.label} →</p>
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-6">
            En pack, vous payez moins et bénéficiez d&apos;un suivi unifié avec un seul interlocuteur
          </p>
        </div>
      </section>

      {/* ── Grille packs ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {packs.map(pack => {
            const c = COULEURS[pack.id] || COULEURS.presence
            return (
              <div
                key={pack.id}
                id={pack.id}
                className={`relative rounded-2xl border bg-gradient-to-b ${c.border} ${c.bg} p-6 flex flex-col transition-all duration-300 hover:scale-[1.02] ${
                  pack.popular ? 'ring-1 ring-cyan-500/30' : ''
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-cyan-500/25">
                    ⭐ Le plus populaire
                  </div>
                )}
                {pack.badge && !pack.popular && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold mb-3 inline-block w-fit ${c.badge}`}>
                    {pack.badge}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-black text-white mb-1">{pack.nom}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{pack.description}</p>
                </div>

                {/* Prix */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{pack.prix_mensuel}€</span>
                    <span className="text-slate-500 text-sm">/mois</span>
                  </div>
                  {pack.prix_creation && (
                    <p className="text-xs text-slate-500 mt-1">
                      + <span className="text-white font-semibold">{pack.prix_creation}€</span> création (1 fois)
                    </p>
                  )}
                  {pack.economie_mensuelle > 0 && (
                    <p className="text-xs text-emerald-400 mt-2 font-semibold">
                      ✓ Économie : {pack.economie_mensuelle}€/mois vs séparé
                    </p>
                  )}
                </div>

                {/* Services inclus */}
                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Inclus :</p>
                  <div className="flex flex-wrap gap-1">
                    {pack.services_inclus.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-6">
                  {pack.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={pack.cta_href || '/register'}
                  className={`block text-center py-3 rounded-xl text-sm font-bold text-white transition-all bg-gradient-to-r ${c.btn} hover:opacity-90 hover:shadow-lg`}
                >
                  {pack.cta_label}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Tableau comparatif ── */}
      <section className="border-y border-white/5 bg-white/2 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">Comparer les packs</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-4 text-slate-400 font-semibold w-1/3">Fonctionnalité</th>
                  {packs.map(p => (
                    <th key={p.id} className={`px-4 py-4 font-black text-center ${p.popular ? 'text-cyan-400' : 'text-white'}`}>
                      {p.nom.replace('Pack ', '')}
                      <div className={`text-xs font-normal mt-0.5 ${p.popular ? 'text-cyan-500' : 'text-slate-500'}`}>
                        {p.prix_mensuel}€/mois
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { label: 'SaaS Panel (gestion PME)',         ids: ['presence', 'croissance', 'acceleration', 'entreprise'] },
                  { label: 'Site web professionnel',            ids: ['presence', 'croissance', 'acceleration', 'entreprise'] },
                  { label: 'Marketing Starter (4h/mois)',       ids: ['croissance', 'acceleration', 'entreprise'] },
                  { label: 'Marketing Pro (8h/mois)',           ids: ['acceleration', 'entreprise'] },
                  { label: 'Marketing Expert (15h/mois)',       ids: ['entreprise'] },
                  { label: 'ADS Meta + Google gérés',          ids: ['acceleration', 'entreprise'] },
                  { label: 'Partenariats influenceurs',         ids: ['entreprise'] },
                  { label: 'Account manager senior dédié',     ids: ['entreprise'] },
                  { label: 'Support prioritaire 7j/7',         ids: ['entreprise'] },
                ].map(row => (
                  <tr key={row.label} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 text-slate-300 text-xs">{row.label}</td>
                    {packs.map(p => (
                      <td key={p.id} className="px-4 py-3.5 text-center">
                        {row.ids.includes(p.id)
                          ? <span className="text-emerald-400 text-base">✓</span>
                          : <span className="text-slate-700">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Garanties ── */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { icon: '🔒', title: 'Données France', desc: 'Hébergé chez OVH, certifié' },
            { icon: '🔄', title: '30j remboursé', desc: 'Satisfait ou remboursé' },
            { icon: '🚀', title: 'Résiliation libre', desc: 'Sans engagement' },
            { icon: '🎧', title: 'Support humain', desc: 'Une vraie personne' },
          ].map(g => (
            <div key={g.title} className="rounded-xl border border-white/8 bg-white/2 p-5 text-center">
              <div className="text-2xl mb-2">{g.icon}</div>
              <p className="text-sm font-bold text-white mb-1">{g.title}</p>
              <p className="text-xs text-slate-500">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="pb-24 max-w-3xl mx-auto px-6 text-center">
        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-purple-500/5 p-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-5 text-2xl">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Pas sûr du bon pack ?</h2>
          <p className="text-slate-400 mb-7">
            Commencez par l&apos;essai gratuit 30 jours du SaaS Panel. Vous pourrez évoluer vers un pack quand vous voulez.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:opacity-90 transition-all"
            >
              Démarrer l&apos;essai gratuit
            </Link>
            <Link
              href="/saas"
              className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              Voir le SaaS Panel
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-4">Sans carte bancaire · Annulation libre</p>
        </div>
      </section>
    </div>
  )
}
