'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Menu, X } from 'lucide-react'

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '/saas' },
    { label: 'Site Web', href: '/web' },
    { label: 'Marketing', href: '/services-marketing' },
    { label: 'Packs Complets', href: '/packs' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/60 backdrop-blur-xl border-b border-cyan-500/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            SENTINEL
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-all animate-glow-pulse"
          >
            Essai gratuit
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden text-slate-300 hover:text-white p-2"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-3">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-slate-400 hover:text-white py-2 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-center text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-white/10"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm text-center font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
