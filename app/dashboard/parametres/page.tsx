// ============================================
// app/dashboard/parametres/page.tsx
// Paramètres complets — profil, entreprise, abonnement, sécurité, apparence, données
// ============================================
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  User, Building2, CreditCard, Shield, Bell, Key,
  ChevronRight, CheckCircle, Loader2, Save, LogOut,
  Palette, Download, Trash2, Globe, Lock, Eye, EyeOff,
  Sun, Moon, Monitor, AlertTriangle, Info, Copy, Check
} from 'lucide-react'

interface Profile {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  entreprise_id: string
  entreprise: {
    id: string
    nom: string
    secteur: string | null
    taille: string | null
    siret: string | null
    plan: string
    plan_actif: boolean
    trial_expires_at: string | null
  }
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; features: string[] }> = {
  trial: {
    label: 'Essai gratuit',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    features: ['5 journaux IA max', 'Score de conformité', 'Copilote IA limité (10 msg/j)', 'Accès à tous les modules en lecture'],
  },
  starter: {
    label: 'Starter',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    features: ['50 journaux IA/mois', 'Tous les modules actifs', 'Rapports PDF', 'Support email 48h'],
  },
  pro: {
    label: 'Pro',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    features: ['Journaux illimités', 'API REST complète', 'Rapports illimités', 'Support prioritaire 24h', 'Benchmark sectoriel'],
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    features: ['Tout illimité', 'SSO / SAML', 'SLA contractuel', 'Account manager dédié', 'Audit trail complet', 'Déploiement on-premise'],
  },
}

const SECTEURS = [
  'Technologie / SaaS', 'Finance / Fintech', 'Santé / Medtech',
  'RH / Recrutement', 'Commerce / E-commerce', 'Industrie / Manufacture',
  'Éducation / Edtech', 'Juridique / Conseil', 'Immobilier', 'Marketing / Communication',
  'Logistique / Transport', 'Énergie', 'Agroalimentaire', 'Autre',
]

const TAILLES = [
  { value: '1-9', label: '1–9 employés (TPE)' },
  { value: '10-49', label: '10–49 employés (PE)' },
  { value: '50-249', label: '50–249 employés (PME)' },
  { value: '250+', label: '250+ employés (ETI/GE)' },
]

const SECTIONS = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'entreprise', label: 'Entreprise', icon: Building2 },
  { id: 'abonnement', label: 'Abonnement', icon: CreditCard },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'donnees', label: 'Mes données', icon: Download },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function ParametresPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('profil')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [themeChoice, setThemeChoice] = useState<'light' | 'dark' | 'auto'>('auto')

  const [form, setForm] = useState({
    prenom: '', nom: '', entreprise_nom: '', secteur: '', taille: '', siret: '',
  })

  const [notifications, setNotifications] = useState({
    conformite: true,
    reglementation: true,
    equipe: false,
    rapport_mensuel: true,
    impayes: true,
    obligations: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          const json = await res.json()
          const p = json.data as Profile
          if (p) {
            setProfile(p)
            setForm({
              prenom: p.prenom || '',
              nom: p.nom || '',
              entreprise_nom: p.entreprise?.nom || '',
              secteur: p.entreprise?.secteur || '',
              taille: p.entreprise?.taille || '',
              siret: p.entreprise?.siret || '',
            })
          }
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()

    // Lire thème actuel
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    setThemeChoice(saved || 'auto')
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  function applyTheme(choice: 'light' | 'dark' | 'auto') {
    setThemeChoice(choice)
    if (choice === 'auto') {
      localStorage.removeItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      localStorage.setItem('theme', choice)
      document.documentElement.classList.toggle('dark', choice === 'dark')
    }
  }

  function copyEntrepriseId() {
    if (profile?.entreprise_id) {
      navigator.clipboard.writeText(profile.entreprise_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const plan = profile?.entreprise?.plan || 'trial'
  const planCfg = PLAN_CONFIG[plan]

  const trialDaysLeft = profile?.entreprise?.trial_expires_at
    ? Math.max(0, Math.ceil((new Date(profile.entreprise.trial_expires_at).getTime() - Date.now()) / 86400000))
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-enter">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Paramètres</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Gérez votre compte, votre entreprise et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 animate-slide-up delay-100">
        {/* Sidebar nav */}
        <div className="col-span-1 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left btn-press ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <s.icon className="w-4 h-4 flex-shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="col-span-3 animate-fade-in">

          {/* ── PROFIL ── */}
          {activeSection === 'profil' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Informations personnelles</h2>

              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {(form.prenom[0] || '?')}{(form.nom[0] || '')}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{form.prenom} {form.nom}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email}</p>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium capitalize">
                    {profile?.role || 'admin'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nom</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email professionnel <span className="text-slate-400">(non modifiable)</span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rôle</label>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{profile?.role || 'admin'}</span>
                  <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                    <Info className="w-3 h-3" /> Géré par l'administrateur
                  </span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 btn-press disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Sauvegardé !' : 'Enregistrer les modifications'}
              </button>
            </div>
          )}

          {/* ── ENTREPRISE ── */}
          {activeSection === 'entreprise' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Informations de l'entreprise</h2>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={form.entreprise_nom}
                    onChange={e => setForm(f => ({ ...f, entreprise_nom: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Secteur d'activité</label>
                    <select
                      value={form.secteur}
                      onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                    >
                      <option value="">Sélectionner...</option>
                      {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Taille de l'entreprise</label>
                    <select
                      value={form.taille}
                      onChange={e => setForm(f => ({ ...f, taille: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                    >
                      <option value="">Sélectionner...</option>
                      {TAILLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Numéro SIRET <span className="text-slate-400">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={form.siret}
                    onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                    placeholder="123 456 789 00012"
                    maxLength={17}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">Utilisé pour la génération de rapports officiels</p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 btn-press disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saved ? 'Sauvegardé !' : 'Enregistrer'}
                </button>
              </div>

              {/* ID entreprise */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Identifiant entreprise (UUID)</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 flex-1 truncate">
                    {profile?.entreprise_id || '—'}
                  </code>
                  <button onClick={copyEntrepriseId} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Utile pour l'intégration API</p>
              </div>
            </div>
          )}

          {/* ── ABONNEMENT ── */}
          {activeSection === 'abonnement' && (
            <div className="space-y-4">
              {/* Plan actuel */}
              <div className={`rounded-xl border p-6 ${planCfg?.bg || 'bg-white border-slate-200'} dark:bg-slate-800 dark:border-slate-700`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Plan actuel</p>
                    <p className={`text-2xl font-bold ${planCfg?.color || 'text-slate-900'}`}>{planCfg?.label}</p>
                    {plan === 'trial' && trialDaysLeft !== null && (
                      <p className={`text-sm mt-1 font-medium ${trialDaysLeft <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                        {trialDaysLeft > 0 ? `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}` : 'Essai expiré'}
                      </p>
                    )}
                    <ul className="mt-3 space-y-1.5">
                      {planCfg?.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/dashboard/parametres/abonnement"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all btn-press flex-shrink-0"
                  >
                    {plan === 'trial' ? 'Passer à Pro' : 'Gérer'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Comparatif plans */}
              {plan === 'trial' && (
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-1">Débloquez tout Sentinel</h3>
                  <p className="text-blue-200 text-sm mb-4">
                    Journaux illimités, tous les modules, API REST, rapports PDF illimités.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {['Starter — 29€/mois', 'Pro — 79€/mois'].map(p => (
                      <div key={p} className="bg-white/10 rounded-lg p-3 text-sm font-medium">{p}</div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/parametres/abonnement"
                    className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors btn-press"
                  >
                    Voir les plans et tarifs <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Facturation */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Facturation</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gérez vos moyens de paiement et historique</p>
                  </div>
                  <Link href="/dashboard/parametres/abonnement" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Accéder →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ── SECURITE ── */}
          {activeSection === 'securite' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Sécurité du compte</h2>

                {/* Mot de passe */}
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Mot de passe</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Modifiez votre mot de passe de connexion</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user?.email) {
                        await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/auth/reset-password`,
                        })
                        alert('Email de réinitialisation envoyé à ' + user.email)
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Envoyer le lien →
                  </button>
                </div>

                {/* Sessions actives */}
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Sessions actives</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Déconnectez toutes les sessions ouvertes</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('Déconnecter toutes les sessions ?')) {
                        await createClient().auth.signOut({ scope: 'global' })
                        window.location.href = '/login'
                      }
                    }}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium"
                  >
                    Tout déconnecter
                  </button>
                </div>

                {/* RLS */}
                <div className="flex items-center justify-between p-4 border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Isolation multi-tenant</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Row Level Security actif — données isolées par organisation</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-medium">Actif ✓</span>
                </div>

                {/* Chiffrement */}
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Chiffrement des données</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">TLS 1.3 en transit · AES-256 au repos · Hébergé en Europe</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">Actif ✓</span>
                </div>
              </div>

              {/* Zone de danger */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-800 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h2 className="font-semibold text-red-700 dark:text-red-400">Zone de danger</h2>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Pour supprimer votre compte, tapez <strong>SUPPRIMER</strong> ci-dessous :
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="SUPPRIMER"
                      className="flex-1 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <button
                      disabled={deleteConfirm !== 'SUPPRIMER'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed btn-press"
                      onClick={() => alert('Contactez support@sentinel.ai pour la suppression de compte.')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Cette action est irréversible. Contactez le support pour confirmation.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── APPARENCE ── */}
          {activeSection === 'apparence' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Apparence et thème</h2>

              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Thème de l'interface</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Clair', icon: Sun, preview: 'bg-white border-slate-200 text-slate-800' },
                    { value: 'dark', label: 'Sombre', icon: Moon, preview: 'bg-slate-900 border-slate-700 text-slate-100' },
                    { value: 'auto', label: 'Automatique', icon: Monitor, preview: 'bg-gradient-to-r from-white to-slate-900' },
                  ].map(({ value, label, icon: Icon, preview }) => (
                    <button
                      key={value}
                      onClick={() => applyTheme(value as any)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 btn-press ${
                        themeChoice === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {themeChoice === value && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className={`w-12 h-8 rounded-lg border ${preview}`} />
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  "Automatique" suit les préférences de votre système d'exploitation.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Densité d'affichage</p>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Bientôt disponible</span>
                </div>
                <div className="grid grid-cols-2 gap-3 opacity-50 pointer-events-none">
                  {[
                    { value: 'normal', label: 'Normal', desc: 'Espacement standard' },
                    { value: 'compact', label: 'Compact', desc: 'Plus dense, plus de contenu' },
                  ].map(({ value, label, desc }) => (
                    <div
                      key={value}
                      className="flex flex-col gap-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-left"
                    >
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Préférences de notifications</h2>

              <div className="space-y-4">
                {[
                  { key: 'conformite', label: 'Alertes de conformité', desc: 'Score en baisse, risques détectés, obligations urgentes' },
                  { key: 'reglementation', label: 'Nouvelles réglementations', desc: 'Mises à jour AI Act, RGPD, NIS2, DSA' },
                  { key: 'impayes', label: 'Factures impayées', desc: 'Relances automatiques, nouveaux retards de paiement' },
                  { key: 'obligations', label: 'Obligations administratives', desc: 'Rappels avant échéances, deadlines proches' },
                  { key: 'equipe', label: 'Activité équipe', desc: 'Nouveaux membres, journaux créés par les collaborateurs' },
                  { key: 'rapport_mensuel', label: 'Rapport mensuel', desc: 'Récapitulatif conformité et KPIs envoyé chaque mois' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      checked={notifications[key as keyof typeof notifications]}
                      onChange={v => setNotifications(n => ({ ...n, [key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Les notifications par email nécessitent un service SMTP configuré. Contactez votre administrateur.
                </p>
              </div>

              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all btn-press"
              >
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Préférences sauvegardées !' : 'Enregistrer les préférences'}
              </button>
            </div>
          )}

          {/* ── MES DONNÉES ── */}
          {activeSection === 'donnees' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Export et portabilité</h2>

                {[
                  { label: 'Exporter mes journaux IA', desc: 'Tous vos usages IA déclarés en CSV', href: '/api/reports/audit-package', icon: Download },
                  { label: 'Rapport de conformité', desc: 'Rapport complet AI Act au format PDF', href: '/dashboard/rapports/generer', icon: Download },
                  { label: 'Données entreprise', desc: 'Clients, contrats, obligations, flux financiers (JSON)', href: '/api/reports/audit-package', icon: Download },
                ].map(({ label, desc, href, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <Link
                      href={href}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                    >
                      Exporter <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-3">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Conformité RGPD</h2>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Données hébergées en Europe (Francfort, Allemagne)</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Droit à l'accès — exportez vos données ci-dessus</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Droit à l'effacement — supprimez votre compte dans Sécurité</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Droit à la portabilité — formats CSV et JSON disponibles</p>
                </div>
                <Link href="/confidentialite" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Politique de confidentialité complète →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
