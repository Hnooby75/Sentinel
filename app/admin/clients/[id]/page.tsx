'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, Globe, Save, Check, Loader2, AlertCircle,
  Trash2, Clock, RefreshCw, Activity, ShieldOff, ShieldCheck, Eye,
  Megaphone, UserCircle, Plus
} from 'lucide-react'
import Link from 'next/link'

interface Entreprise {
  id: string; nom: string; plan: string; plan_actif: boolean
  trial_expires_at: string | null; secteur: string | null; taille: string | null; created_at: string
}
interface Utilisateur {
  id: string; email: string; prenom: string; nom: string; role: string; actif: boolean; created_at: string
}
interface SiteClient {
  statut: string; url: string | null; updated_at: string | null
}
interface Activite {
  action: string; created_at: string
}
interface Agent {
  id: string; prenom: string; nom: string; role: string; photo_url: string | null; missions_actives: number
}
interface Mission {
  id: string
  agent_id: string | null
  heures_allouees_par_mois: number
  statut: string
  notes: string | null
  agent: Agent | null
}

const PLANS = ['trial', 'starter', 'pro', 'enterprise']
const PLAN_PRICES: Record<string, number> = { starter: 79, pro: 149, enterprise: 499 }
const PLAN_LABELS: Record<string, string> = {
  trial: 'Essai gratuit', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise',
}

const planColors: Record<string, string> = {
  trial:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  starter:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pro:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  enterprise: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const ROLE_LABELS: Record<string, string> = {
  agent_junior: 'Agent junior', agent_senior: 'Agent senior',
  manager: 'Manager', directeur: 'Directeur',
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [extending,  setExtending]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null)
  const [members,    setMembers]    = useState<Utilisateur[]>([])
  const [site,       setSite]       = useState<SiteClient | null>(null)
  const [activite,   setActivite]   = useState<Activite[]>([])

  // Champs éditables plan
  const [nom,       setNom]       = useState('')
  const [plan,      setPlan]      = useState('trial')
  const [planActif, setPlanActif] = useState(false)

  // Champs éditables site web
  const [siteUrl,      setSiteUrl]      = useState('')
  const [siteStatut,   setSiteStatut]   = useState('en_creation')
  const [siteWebActif, setSiteWebActif] = useState(false)
  const [siteSaving,   setSiteSaving]   = useState(false)
  const [siteSaved,    setSiteSaved]    = useState(false)
  const [siteError,    setSiteError]    = useState<string | null>(null)

  // Marketing
  const [mission,        setMission]        = useState<Mission | null>(null)
  const [agents,         setAgents]         = useState<Agent[]>([])
  const [missionLoading, setMissionLoading] = useState(true)
  const [missionSaving,  setMissionSaving]  = useState(false)
  const [missionSaved,   setMissionSaved]   = useState(false)
  const [missionError,   setMissionError]   = useState<string | null>(null)
  // Form mission
  const [selectedAgent,  setSelectedAgent]  = useState('')
  const [heures,         setHeures]         = useState(4)
  const [statutMission,  setStatutMission]  = useState('active')
  const [notesMission,   setNotesMission]   = useState('')

  const loadMarketing = useCallback(async () => {
    setMissionLoading(true)
    try {
      const [missionRes, agentsRes] = await Promise.all([
        fetch(`/api/admin/marketing/${id}`),
        fetch('/api/admin/marketing/agents'),
      ])

      if (agentsRes.ok) {
        const d = await agentsRes.json()
        setAgents(d.agents || [])
      }

      if (missionRes.ok) {
        const d = await missionRes.json()
        const m = d.mission as Mission | null
        setMission(m)
        if (m) {
          setSelectedAgent(m.agent_id || '')
          setHeures(m.heures_allouees_par_mois || 4)
          setStatutMission(m.statut || 'active')
          setNotesMission(m.notes || '')
        }
      }
    } catch {
      // silencieux
    } finally {
      setMissionLoading(false)
    }
  }, [id])

  function load() {
    setLoading(true)
    fetch(`/api/admin/clients/${id}`)
      .then(r => r.json())
      .then(d => {
        setEntreprise(d.entreprise)
        setMembers(d.utilisateurs || [])
        setSite(d.site)
        setActivite(d.activite_recente || [])
        if (d.entreprise) {
          setNom(d.entreprise.nom)
          setPlan(d.entreprise.plan)
          setPlanActif(d.entreprise.plan_actif)
        }
        if (d.site) {
          setSiteUrl(d.site.url || '')
          setSiteStatut(d.site.statut || 'en_creation')
        }
        if (d.entreprise) {
          setSiteWebActif(d.entreprise.site_web_actif ?? false)
        }
      })
      .catch(() => setError('Impossible de charger le client'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    loadMarketing()
  }, [id, loadMarketing])

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, plan, plan_actif: planActif }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      setEntreprise(prev => prev ? { ...prev, nom, plan, plan_actif: planActif } : prev)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleExtendTrial() {
    setExtending(true); setError(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_trial: true }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setExtending(false) }
  }

  async function handleToggleSuspend() {
    setSaving(true); setError(null)
    const newActif = !planActif
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_actif: newActif }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setPlanActif(newActif)
      setEntreprise(prev => prev ? { ...prev, plan_actif: newActif } : prev)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true); setError(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      router.push('/admin/clients')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
      setDeleting(false); setConfirmDel(false)
    }
  }

  async function handleSaveMission() {
    setMissionSaving(true); setMissionError(null)
    try {
      const res = await fetch(`/api/admin/marketing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent || null,
          heures_allouees_par_mois: heures,
          statut: statutMission,
          notes: notesMission || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de la sauvegarde')
      }
      setMissionSaved(true)
      setTimeout(() => setMissionSaved(false), 3000)
      await loadMarketing()
    } catch (e: unknown) {
      setMissionError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setMissionSaving(false)
    }
  }

  async function handleSaveSite() {
    setSiteSaving(true); setSiteError(null)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: siteUrl || null,
          site_statut: siteStatut,
          site_web_actif: siteWebActif,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de la sauvegarde')
      }
      setSiteSaved(true)
      setTimeout(() => setSiteSaved(false), 3000)
      load() // Recharger les données
    } catch (e: unknown) {
      setSiteError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSiteSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
    </div>
  )

  if (!entreprise) return (
    <div className="text-center py-20 text-slate-500">Client introuvable</div>
  )

  const trialExpired = entreprise.trial_expires_at && new Date(entreprise.trial_expires_at) < new Date()
  const trialDate    = entreprise.trial_expires_at
    ? new Date(entreprise.trial_expires_at).toLocaleDateString('fr-FR')
    : null

  const currentAgent = agents.find(a => a.id === selectedAgent)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className="text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{entreprise.nom}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Inscrit le {new Date(entreprise.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href={`/admin/clients/${entreprise.id}/apercu`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Voir aperçu
          </Link>
          {entreprise.plan_actif ? (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Actif</span>
          ) : trialExpired ? (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Trial expiré</span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Trial</span>
          )}
          <span className={`text-xs px-3 py-1 rounded-full border ${planColors[entreprise.plan] || planColors.trial}`}>
            {PLAN_LABELS[entreprise.plan] || entreprise.plan}
            {PLAN_PRICES[entreprise.plan] ? ` — ${PLAN_PRICES[entreprise.plan]}€/mois` : ''}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Édition plan */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="font-semibold text-white">Informations & Plan</h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Nom de l&apos;entreprise</label>
            <input
              value={nom}
              onChange={e => setNom(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Plan d&apos;abonnement</label>
            <select
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {PLANS.map(p => (
                <option key={p} value={p}>{PLAN_LABELS[p]}{PLAN_PRICES[p] ? ` — ${PLAN_PRICES[p]}€/mois` : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
            <div>
              <p className="text-sm font-medium text-white">Plan actif</p>
              <p className="text-xs text-slate-400">Le client a accès au dashboard</p>
            </div>
            <button
              onClick={() => setPlanActif(!planActif)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                planActif ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                planActif ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {trialDate && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Trial expire le</span>
              <span className={trialExpired ? 'text-red-400' : 'text-amber-400'}>{trialDate}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>

            <button
              onClick={handleExtendTrial}
              disabled={extending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm transition-all disabled:opacity-60"
            >
              {extending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              +30 jours trial
            </button>
          </div>
        </div>

        {/* Site web + Suspension */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Site web client
            </h2>
            
            {siteError && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4" /> {siteError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">URL du site</label>
                <input
                  value={siteUrl}
                  onChange={e => setSiteUrl(e.target.value)}
                  placeholder="https://exemple.com ou /site/mon-slug"
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Statut</label>
                <select
                  value={siteStatut}
                  onChange={e => setSiteStatut(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="en_creation">En création</option>
                  <option value="en_ligne">En ligne</option>
                  <option value="en_maintenance">En maintenance</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div>
                  <p className="text-sm font-medium text-white">Module site web activé</p>
                  <p className="text-xs text-slate-400">Le client accède à /dashboard/site-web</p>
                </div>
                <button
                  onClick={() => setSiteWebActif(!siteWebActif)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    siteWebActif ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    siteWebActif ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {site?.updated_at && (
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-slate-400">Dernière mise à jour</span>
                  <span className="text-slate-300">
                    {new Date(site.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <button
                onClick={handleSaveSite}
                disabled={siteSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition-all"
              >
                {siteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : siteSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {siteSaving ? 'Sauvegarde...' : siteSaved ? 'Site sauvegardé !' : 'Sauvegarder le site'}
              </button>
            </div>
          </div>

          {/* Suspension rapide */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold text-white mb-4">Accès au compte</h2>
            <button
              onClick={handleToggleSuspend}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
                planActif
                  ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : planActif ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {planActif ? 'Suspendre l\'accès' : 'Réactiver l\'accès'}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================
          SECTION MARKETING — Assignation agent
          ============================================ */}
      <div className="rounded-2xl border border-purple-500/20 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-500/10 flex items-center gap-2 bg-purple-500/5">
          <Megaphone className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-white">Marketing Dédié</h2>
          {mission ? (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              mission.statut === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
              mission.statut === 'pause'  ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              Mission {mission.statut}
            </span>
          ) : (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
              Aucune mission
            </span>
          )}
        </div>

        <div className="p-6">
          {missionLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              {missionError && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {missionError}
                </div>
              )}

              {/* Agent actuel */}
              {mission?.agent && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                  {mission.agent.photo_url ? (
                    <img
                      src={mission.agent.photo_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {mission.agent.prenom[0]}{mission.agent.nom[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white text-sm">{mission.agent.prenom} {mission.agent.nom}</p>
                    <p className="text-xs text-purple-400">{ROLE_LABELS[mission.agent.role] ?? mission.agent.role}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-500">{mission.agent.missions_actives} mission(s)</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Sélecteur d'agent */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                    <UserCircle className="w-3.5 h-3.5" />
                    Agent assigné *
                  </label>
                  {agents.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Aucun agent disponible.{' '}
                        <Link href="/admin/marketing/agents" className="text-amber-400 hover:underline">
                          Créer un agent →
                        </Link>
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedAgent}
                      onChange={e => setSelectedAgent(e.target.value)}
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="">— Aucun agent —</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.prenom} {a.nom} · {ROLE_LABELS[a.role] ?? a.role} ({a.missions_actives} mission{a.missions_actives !== 1 ? 's' : ''})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Heures/mois */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Heures allouées / mois
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    step={0.5}
                    value={heures}
                    onChange={e => setHeures(parseFloat(e.target.value) || 4)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Statut mission */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Statut de la mission</label>
                  <select
                    value={statutMission}
                    onChange={e => setStatutMission(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="active">Active</option>
                    <option value="pause">En pause</option>
                    <option value="terminee">Terminée</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Notes internes</label>
                  <input
                    value={notesMission}
                    onChange={e => setNotesMission(e.target.value)}
                    placeholder="Notes visibles uniquement par l'admin..."
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Preview agent sélectionné */}
              {currentAgent && currentAgent.id !== mission?.agent?.id && (
                <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/5 border border-purple-500/20 px-3 py-2 rounded-lg">
                  <Plus className="w-3.5 h-3.5" />
                  Nouvel agent sélectionné : <strong>{currentAgent.prenom} {currentAgent.nom}</strong>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                <button
                  onClick={handleSaveMission}
                  disabled={missionSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-sm transition-all"
                >
                  {missionSaving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : missionSaved
                    ? <Check className="w-4 h-4" />
                    : <Save className="w-4 h-4" />
                  }
                  {missionSaving ? 'Enregistrement...' : missionSaved ? 'Mission sauvegardée !' : mission ? 'Mettre à jour la mission' : 'Créer la mission'}
                </button>

                <Link
                  href="/admin/marketing/agents"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-purple-400 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Gérer les agents
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      {activite.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            Activité récente
          </h2>
          <div className="space-y-2">
            {activite.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{a.action}</span>
                <span className="text-slate-500 text-xs">
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Membres */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-white">Membres ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-500">Aucun membre</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="text-left px-6 py-3">Nom</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Rôle</th>
                <th className="text-left px-6 py-3">Actif</th>
                <th className="text-left px-6 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-3 font-medium text-white">{m.prenom} {m.nom}</td>
                  <td className="px-6 py-3 text-slate-400">{m.email}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      m.role === 'super_admin' ? 'text-amber-300 border-amber-400/30 bg-amber-500/10' :
                      m.role === 'admin' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                      'text-slate-400 border-slate-700 bg-slate-800'
                    }`}>{m.role}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs ${m.actif ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.actif ? '● Actif' : '○ Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400">
                    {new Date(m.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-400 mb-2">Zone dangereuse</h2>
        <p className="text-sm text-slate-400 mb-4">
          Supprimer ce compte supprime définitivement l&apos;entreprise, ses membres et ses données Sentinel. Cette action est irréversible.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
            confirmDel
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {deleting ? 'Suppression...' : confirmDel ? 'Confirmer la suppression' : 'Supprimer ce client'}
        </button>
        {confirmDel && !deleting && (
          <button
            onClick={() => setConfirmDel(false)}
            className="ml-3 text-sm text-slate-500 hover:text-white transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}
