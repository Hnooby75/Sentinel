// ============================================
// components/dashboard/Sidebar.tsx
// ============================================
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/providers/ThemeProvider'
import {
  LayoutDashboard, FileText, BarChart2,
  FileOutput, Users, Settings, Shield, LogOut,
  AlertCircle, ClipboardList, TrendingUp, FileSignature,
  Sparkles, GraduationCap, Newspaper, ShieldCheck,
  Sun, Moon, Menu, X,
  Megaphone, ShieldAlert, LayoutGrid,
  Layers, UserCheck, Target, Workflow, MessageSquare, HelpCircle
} from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  group: string
  badge?: string
  superAdminOnly?: boolean
}

const navigation: NavItem[] = [
  // Conformité
  { name: 'Tableau de bord',      href: '/dashboard',               icon: LayoutDashboard, group: 'core' },
  { name: 'Journaux IA',          href: '/dashboard/journaux',      icon: FileText,        group: 'core' },
  { name: 'Score conformité',     href: '/dashboard/score',         icon: BarChart2,       group: 'core' },
  // Copilote Dirigeant
  { name: 'Vue Dirigeant',        href: '/dashboard/cockpit',             icon: Layers,     group: 'copilot' },
  { name: 'Finance IA',           href: '/dashboard/copilot-finance',     icon: TrendingUp, group: 'copilot' },
  { name: 'RH IA',                href: '/dashboard/copilot-rh',          icon: UserCheck,  group: 'copilot' },
  { name: 'CRM & Ventes',         href: '/dashboard/copilot-crm',         icon: Target,     group: 'copilot' },
  { name: 'Opérations',           href: '/dashboard/copilot-operations',  icon: Workflow,   group: 'copilot' },
  // IA Native
  { name: 'Copilote IA',          href: '/dashboard/copilot',       icon: Sparkles,        group: 'ai', badge: 'IA' },
  { name: 'Formation',            href: '/dashboard/formation',     icon: GraduationCap,   group: 'ai' },
  { name: 'Veille réglementaire', href: '/dashboard/veille',        icon: Newspaper,       group: 'ai' },
  { name: 'Fournisseurs',         href: '/dashboard/fournisseurs',  icon: ShieldCheck,     group: 'ai' },
  // Présence Digitale
  { name: 'Mon Site Web',         href: '/dashboard/cms',           icon: LayoutGrid,      group: 'digital' },
  { name: 'Marketing',            href: '/dashboard/marketing',     icon: Megaphone,       group: 'digital' },
  // Gestion
  { name: 'Impayés',              href: '/dashboard/impayes',       icon: AlertCircle,     group: 'business' },
  { name: 'Obligations',          href: '/dashboard/obligations',   icon: ClipboardList,   group: 'business' },
  { name: 'Financier',            href: '/dashboard/financier',     icon: TrendingUp,      group: 'business' },
  { name: 'Contrats',             href: '/dashboard/contrats',      icon: FileSignature,   group: 'business' },
  // Administration
  { name: 'Centre d\'aide',       href: '/dashboard/aide',          icon: HelpCircle,      group: 'admin' },
  { name: 'Support SAV',          href: '/dashboard/sav',           icon: MessageSquare,   group: 'admin' },
  { name: 'Rapports',             href: '/dashboard/rapports',      icon: FileOutput,      group: 'admin' },
  { name: 'Équipe',               href: '/dashboard/equipe',        icon: Users,           group: 'admin' },
  { name: 'Paramètres',           href: '/dashboard/parametres',    icon: Settings,        group: 'admin' },
  // Super admin uniquement
  { name: 'Panel Admin',          href: '/admin',                   icon: ShieldAlert,     group: 'admin', superAdminOnly: true, badge: 'ADMIN' },
]

const GROUP_LABELS: Record<string, string> = {
  core:     'Conformité',
  copilot:  'Copilote Dirigeant',
  ai:       'IA Native',
  digital:  'Présence Digitale',
  business: 'Gestion',
  admin:    'Administration',
}


export default function Sidebar({ utilisateur }: { utilisateur: any }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSuperAdmin = utilisateur?.role === 'super_admin'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const planLabels: Record<string, string> = {
    trial: 'Essai gratuit', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
  }
  const planColors: Record<string, string> = {
    trial: 'text-amber-400', starter: 'text-blue-400', pro: 'text-purple-400', enterprise: 'text-emerald-400',
  }

  const filteredNav = navigation.filter(item => !item.superAdminOnly || isSuperAdmin)

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className={`p-1.5 rounded-lg ${isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'}`}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">Sentinel</span>
            {isSuperAdmin && (
              <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{utilisateur.entreprise?.nom}</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
        {(['core', 'copilot', 'ai', 'digital', 'business', 'admin'] as const).map(group => {
          const items = filteredNav.filter(n => n.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} className="space-y-2">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {GROUP_LABELS[group]}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)
                  const isAdminLink = item.superAdminOnly
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? isAdminLink
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-900/30 scale-[1.02]'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30 scale-[1.02]'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-white hover:translate-x-1 hover:shadow-md'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:rotate-3'
                      }`} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold ${
                          item.badge === 'ADMIN' 
                            ? 'bg-amber-400 shadow-sm shadow-amber-500/50' 
                            : 'bg-blue-400 shadow-sm shadow-blue-500/50'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700/50 space-y-3">
        <div className="bg-slate-800 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-500">Plan actuel</p>
          <p className={`text-sm font-semibold mt-0.5 ${planColors[utilisateur.entreprise?.plan || 'trial']}`}>
            {planLabels[utilisateur.entreprise?.plan || 'trial']}
          </p>
          {utilisateur.entreprise?.plan === 'trial' && (
            <Link href="/dashboard/parametres/abonnement"
              className="text-xs text-blue-400 hover:underline mt-1 inline-block">
              Passer à un plan payant →
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
          }`}>
            {utilisateur.prenom?.[0]}{utilisateur.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {utilisateur.prenom} {utilisateur.nom}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">{utilisateur.role}</p>
          </div>
          <button
            onClick={toggle}
            className="text-slate-500 hover:text-yellow-300 transition-all duration-200 p-1 rounded hover:scale-110 hover:rotate-12"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 transition-all duration-150 p-1 rounded hover:scale-110 active:scale-95"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 text-white p-2 rounded-lg shadow-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col flex-shrink-0">
        {navContent}
      </aside>
    </>
  )
}

