'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, Building2, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const SECTEURS = [
  'Technologie / SaaS', 'E-commerce', 'Marketing / Communication',
  'Finance / Comptabilité', 'Santé', 'RH / Recrutement',
  'Juridique', 'Immobilier', 'Formation / Éducation', 'Autre'
]

const TAILLES = [
  { value: '1-5', label: '1 à 5 employés' },
  { value: '6-20', label: '6 à 20 employés' },
  { value: '21-50', label: '21 à 50 employés' },
  { value: '51-200', label: '51 à 200 employés' },
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1) // 1 = infos perso, 2 = infos entreprise
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '',
    entreprise_nom: '', secteur: '', taille: '', siret: ''
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          prenom: form.prenom,
          nom: form.nom,
          entreprise_nom: form.entreprise_nom,
          // Le trigger SQL handle_new_user() créera automatiquement l'entreprise
        }
      }
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email'
        : error.message)
      setLoading(false)
      return
    }

    // Mettre à jour les infos entreprise via API
    router.push('/dashboard?welcome=true')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-soft delay-300" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-float-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 animate-pulse-soft">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Sentinel</span>
          </div>
          <p className="text-slate-400 text-sm">14 jours d'essai gratuit · Sans CB</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-3 mb-6 animate-fade-in delay-100">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= s ? 'bg-blue-500 text-white scale-110 shadow-md shadow-blue-500/30' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-medium transition-colors duration-200 ${step >= s ? 'text-white' : 'text-slate-500'}`}>
                {s === 1 ? 'Vos infos' : 'Votre entreprise'}
              </span>
              {s < 2 && <div className={`w-8 h-0.5 transition-colors duration-300 ${step > s ? 'bg-blue-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8 animate-scale-in delay-150">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {step === 1 && (
              <>
                <h1 className="text-xl font-bold text-slate-900 mb-4">Créez votre compte</h1>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text" required value={form.prenom}
                        onChange={e => update('prenom', e.target.value)}
                        placeholder="Jean"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom</label>
                    <input
                      type="text" required value={form.nom}
                      onChange={e => update('nom', e.target.value)}
                      placeholder="Dupont"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email professionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email" required value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="jean@entreprise.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password" required minLength={8} value={form.password}
                      onChange={e => update('password', e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 text-sm mt-2 btn-press shadow-sm hover:shadow-md hover:shadow-blue-500/25">
                  Continuer →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-xl font-bold text-slate-900 mb-4">Votre entreprise</h1>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de l'entreprise</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text" required value={form.entreprise_nom}
                      onChange={e => update('entreprise_nom', e.target.value)}
                      placeholder="ACME SAS"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Secteur d'activité</label>
                  <select
                    required value={form.secteur}
                    onChange={e => update('secteur', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Taille de l'entreprise</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAILLES.map(t => (
                      <button
                        key={t.value} type="button"
                        onClick={() => update('taille', t.value)}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors text-left ${
                          form.taille === t.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    SIRET <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text" value={form.siret}
                    onChange={e => update('siret', e.target.value)}
                    placeholder="123 456 789 00012"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-sm hover:bg-slate-50"
                  >
                    ← Retour
                  </button>
                  <button
                    type="submit" disabled={loading || !form.taille}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 text-sm btn-press hover:shadow-md hover:shadow-blue-500/25"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : 'Créer mon espace'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/cgu" className="underline">CGU</Link> et notre{' '}
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  )
}
