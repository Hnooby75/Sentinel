'use client'

// ============================================
// app/admin/marketing/agents/page.tsx
// CRUD agents_sentinel
// ============================================
import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'

type Agent = {
  id: string
  prenom: string
  nom: string
  email: string
  role: string
  specialites: string[]
  bio: string | null
  photo_url: string | null
  actif: boolean
  missions_actives: number
}

const ROLES = [
  { value: 'agent_junior', label: 'Agent Junior' },
  { value: 'agent_senior', label: 'Agent Senior' },
  { value: 'manager', label: 'Manager' },
  { value: 'directeur', label: 'Directeur' },
]

const roleColors: Record<string, string> = {
  agent_junior: 'text-blue-400 bg-blue-500/10',
  agent_senior: 'text-purple-400 bg-purple-500/10',
  manager: 'text-amber-400 bg-amber-500/10',
  directeur: 'text-emerald-400 bg-emerald-500/10',
}

export default function AgentsMarketingPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Form state
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('agent_senior')
  const [specialites, setSpecialites] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchAgents() {
    const res = await fetch('/api/admin/marketing/agents')
    if (res.ok) {
      const data = await res.json()
      setAgents(data.agents || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAgents() }, [])

  function resetForm() {
    setPrenom(''); setNom(''); setEmail(''); setRole('agent_senior')
    setSpecialites(''); setBio(''); setPhotoUrl(''); setEditId(null)
    setError('')
  }

  function openCreate() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(agent: Agent) {
    setPrenom(agent.prenom); setNom(agent.nom); setEmail(agent.email)
    setRole(agent.role); setSpecialites(agent.specialites.join(', '))
    setBio(agent.bio || ''); setPhotoUrl(agent.photo_url || '')
    setEditId(agent.id); setShowForm(true); setError('')
  }

  async function handleSave() {
    if (!prenom || !nom || !email || !role) {
      setError('Prénom, nom, email et rôle sont requis.')
      return
    }
    setSaving(true)
    setError('')

    const body = {
      prenom, nom, email, role,
      specialites: specialites.split(',').map(s => s.trim()).filter(Boolean),
      bio: bio || null,
      photo_url: photoUrl || null,
    }

    const res = await fetch('/api/admin/marketing/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Erreur lors de la sauvegarde')
    } else {
      await fetchAgents()
      setShowForm(false)
      resetForm()
    }
    setSaving(false)
  }

  const initials = (a: Agent) => `${a.prenom[0]}${a.nom[0]}`.toUpperCase()

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents Marketing</h1>
          <p className="text-slate-400 text-sm mt-1">Équipe interne Sentinel dédiée aux PME</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel agent
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {editId ? 'Modifier' : 'Créer'} un agent
            </h2>
            <button onClick={() => { setShowForm(false); resetForm() }}>
              <X className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Prénom *</label>
              <input
                value={prenom} onChange={e => setPrenom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Nom *</label>
              <input
                value={nom} onChange={e => setNom(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Rôle *</label>
              <select
                value={role} onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Spécialités (séparées par virgule)</label>
              <input
                value={specialites} onChange={e => setSpecialites(e.target.value)}
                placeholder="ex : Instagram, Meta ADS, SEO"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Bio</label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)}
                rows={2}
                className="w-full resize-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">URL photo</label>
              <input
                value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-semibold text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste agents */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aucun agent créé</p>
          <p className="text-slate-600 text-xs mt-1">Créez votre premier agent marketing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={`rounded-2xl border bg-slate-900 p-5 flex items-center gap-4 transition-opacity ${
                agent.actif ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              {/* Avatar */}
              {agent.photo_url ? (
                <img
                  src={agent.photo_url}
                  alt={`${agent.prenom} ${agent.nom}`}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {initials(agent)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{agent.prenom} {agent.nom}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[agent.role] || 'text-slate-400 bg-slate-500/10'}`}>
                    {ROLES.find(r => r.value === agent.role)?.label ?? agent.role}
                  </span>
                  <span className="text-xs text-slate-500">{agent.missions_actives} mission{agent.missions_actives !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{agent.email}</p>
                {agent.specialites.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {agent.specialites.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(agent)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <div
                  className="p-2 text-slate-500"
                  title={agent.actif ? 'Actif' : 'Inactif'}
                >
                  {agent.actif
                    ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                    : <ToggleLeft className="w-5 h-5" />
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
