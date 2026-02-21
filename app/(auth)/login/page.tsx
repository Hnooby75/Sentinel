'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, Loader2, AlertCircle, ChevronRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    // Créer automatiquement le profil si c'est le premier accès
    await fetch('/api/auth/setup', { method: 'POST' })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-700/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo — float-in */}
        <div className="flex flex-col items-center mb-8 animate-float-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 animate-pulse-soft">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Sentinel</span>
          </div>
          <p className="text-slate-400 text-sm">Compliance OS pour PME</p>
        </div>

        {/* Card — scale-in avec délai */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8 animate-scale-in delay-150">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 animate-fade-in delay-200">Connexion</h1>
          <p className="text-slate-500 text-sm mb-6 animate-fade-in delay-300">Accédez à votre tableau de bord conformité</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="animate-fade-in delay-200">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email professionnel
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="vous@entreprise.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 hover:border-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-fade-in delay-300">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 hover:border-slate-400"
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="animate-fade-in delay-400">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-2 btn-press shadow-sm hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.97]"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Connexion en cours...</>
                ) : (
                  <>Se connecter <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center animate-fade-in delay-500">
            <p className="text-sm text-slate-500">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
                Créer votre espace entreprise
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6 animate-fade-in delay-500">
          Données hébergées en Europe · Conforme RGPD · Chiffrement AES-256
        </p>
      </div>
    </div>
  )
}
