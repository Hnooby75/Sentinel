// ============================================
// app/dashboard/equipe/page.tsx
// Gestion des membres + invitation
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, Mail, Crown, Eye, Plus, X, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  admin: {
    label: 'Admin', color: 'bg-purple-100 text-purple-700',
    icon: Crown, desc: 'Accès complet, gestion équipe et abonnement'
  },
  manager: {
    label: 'Manager', color: 'bg-blue-100 text-blue-700',
    icon: Shield, desc: 'Peut créer des journaux, modifier, générer des rapports'
  },
  employe: {
    label: 'Employé', color: 'bg-green-100 text-green-700',
    icon: Users, desc: 'Peut déclarer ses propres usages IA'
  },
  lecteur: {
    label: 'Lecteur', color: 'bg-slate-100 text-slate-600',
    icon: Eye, desc: 'Consultation uniquement, pas de modification'
  },
}

interface Membre {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  actif: boolean
  derniere_connexion: string | null
}

export default function EquipePage() {
  const [membres, setMembres] = useState<Membre[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentRole, setCurrentRole] = useState<string>('employe')
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteForm, setInviteForm] = useState({ email: '', prenom: '', nom: '', role: 'employe' })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Récupérer l'utilisateur courant
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: u } = await supabase.from('utilisateurs').select('role').eq('id', user.id).single()
        if (u) setCurrentRole(u.role)
      }

      const r = await fetch('/api/equipe/invite')
      if (r.ok) {
        const data = await r.json()
        setMembres(data.data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.prenom || !inviteForm.nom) {
      setInviteError('Tous les champs sont requis')
      return
    }
    setInviting(true)
    setInviteError('')

    try {
      const res = await fetch('/api/equipe/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error || 'Erreur invitation')
      } else {
        setInviteSuccess(`Invitation envoyée à ${inviteForm.email} !`)
        setInviteForm({ email: '', prenom: '', nom: '', role: 'employe' })
        setShowInviteForm(false)
        setTimeout(() => setInviteSuccess(''), 5000)
        await loadData()
      }
    } catch {
      setInviteError('Erreur réseau')
    } finally {
      setInviting(false)
    }
  }

  const isAdmin = currentRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Équipe</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {membres.length} membre{membres.length > 1 ? 's' : ''} dans votre organisation
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Succès */}
      {inviteSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4" />
          {inviteSuccess}
        </div>
      )}

      {/* Formulaire invitation */}
      {showInviteForm && isAdmin && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              Inviter un nouveau membre
            </h2>
            <button onClick={() => setShowInviteForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input
                type="text"
                value={inviteForm.prenom}
                onChange={e => setInviteForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Marie"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input
                type="text"
                value={inviteForm.nom}
                onChange={e => setInviteForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="marie@exemple.fr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rôle *</label>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lecteur">Lecteur (consultation)</option>
                <option value="employe">Employé (déclarations)</option>
                <option value="manager">Manager (gestion + rapports)</option>
                <option value="admin">Admin (accès complet)</option>
              </select>
            </div>
          </div>
          {inviteError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {inviteError}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {inviting ? 'Envoi…' : 'Envoyer l\'invitation'}
            </button>
            <button onClick={() => setShowInviteForm(false)} className="text-sm text-slate-500 hover:text-slate-700">
              Annuler
            </button>
          </div>
          <p className="text-xs text-slate-400">
            L'invité recevra un email avec un lien pour rejoindre votre organisation Sentinel.
          </p>
        </div>
      )}

      {/* Info sur les rôles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold mb-2 ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
              </div>
              <p className="text-xs text-slate-500">{config.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Liste membres */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Membres</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {membres.map(membre => {
            const roleConfig = ROLE_CONFIG[membre.role] || ROLE_CONFIG.employe
            const RoleIcon = roleConfig.icon
            const isMe = membre.id === currentUserId

            return (
              <div key={membre.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {membre.prenom?.[0]}{membre.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{membre.prenom} {membre.nom}</p>
                    {isMe && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Vous</span>}
                    {!membre.actif && (
                      <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">En attente</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{membre.email}</p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleConfig.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </div>
                <div className="text-xs text-slate-400 hidden md:block min-w-[140px] text-right">
                  {membre.derniere_connexion
                    ? `Vu le ${new Date(membre.derniere_connexion).toLocaleDateString('fr-FR')}`
                    : membre.actif ? 'Jamais connecté' : 'Invitation envoyée'
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Note sécurité */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Sécurité multi-tenant</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Chaque membre ne voit que les données de votre organisation.
            L'isolation est garantie au niveau base de données (Row Level Security).
          </p>
        </div>
      </div>
    </div>
  )
}
