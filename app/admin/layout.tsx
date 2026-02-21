// ============================================
// app/admin/layout.tsx
// Panel super_admin — layout séparé du dashboard
// ============================================
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUtilisateur } from '@/lib/supabase/getUtilisateur'
import { Shield, LayoutDashboard, Users, LogOut, Bell, MessageSquare, Megaphone, Ticket } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const utilisateur = await getUtilisateur(user.id)
  if (!utilisateur || utilisateur.role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar admin */}
      <aside className="w-56 bg-slate-900 border-r border-amber-500/20 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <Shield className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm">SENTINEL</span>
          </div>
          <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded">
            PANEL ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin',               label: 'Vue d\'ensemble', icon: LayoutDashboard },
            { href: '/admin/clients',       label: 'Clients',         icon: Users },
            { href: '/admin/marketing',     label: 'Marketing',       icon: Megaphone },
            { href: '/admin/notifications', label: 'Notifications',   icon: Bell },
            { href: '/admin/sav',           label: 'Chat SAV',        icon: MessageSquare },
            { href: '/admin/sav/tickets',   label: 'Tickets',         icon: Ticket },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-amber-500/20 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Retour au dashboard
          </Link>
          <p className="text-xs text-slate-600">
            {utilisateur.prenom} {utilisateur.nom}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
