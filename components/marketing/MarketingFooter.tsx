import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function MarketingFooter() {
  return (
    <footer style={{ backgroundColor: '#05070f' }} className="border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Produit */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Produit</h3>
            <ul className="space-y-2">
              {[
                { label: 'Fonctionnalités', href: '/saas' },
                { label: 'Packs & Tarifs', href: '/#pricing' },
                { label: 'Démo', href: '/register' },
                { label: 'Changelog', href: '#' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Services</h3>
            <ul className="space-y-2">
              {[
                { label: 'SaaS Conformité', href: '/saas' },
                { label: 'Site Web Géré', href: '/web' },
                { label: 'Marketing Humain', href: '/services-marketing' },
                { label: 'Optimisation Fiscale', href: '/register' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Légal</h3>
            <ul className="space-y-2">
              {[
                { label: 'Mentions légales', href: '/mentions-legales' },
                { label: 'Confidentialité', href: '/confidentialite' },
                { label: 'CGU', href: '/cgu' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><span className="text-sm text-slate-500">contact@sentinel.fr</span></li>
              <li><span className="text-sm text-slate-500">Support 9h–18h lun–ven</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">SENTINEL</span>
          </div>
          <p className="text-xs text-slate-600 text-center">
            Données hébergées en France 🇫🇷 · © {new Date().getFullYear()} Sentinel SAS · Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  )
}
