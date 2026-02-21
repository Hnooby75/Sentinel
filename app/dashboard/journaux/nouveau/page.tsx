'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Save, Loader2,
  AlertCircle, Info, CheckCircle2
} from 'lucide-react'

const OUTILS_IA = [
  'ChatGPT (OpenAI)', 'Claude (Anthropic)', 'Gemini (Google)',
  'Copilot (Microsoft)', 'Mistral AI', 'Llama (Meta)', 'Custom / Autre'
]

const CATEGORIES = [
  { value: 'generation_contenu', label: '✍️ Génération de contenu', desc: 'Rédaction, traduction, résumé...' },
  { value: 'analyse_donnees', label: '📊 Analyse de données', desc: 'Traitement, extraction d\'informations...' },
  { value: 'decision_automatisee', label: '🤖 Décision automatisée', desc: 'Scoring, classification, recommandation...' },
  { value: 'interaction_client', label: '💬 Interaction client', desc: 'Chatbot, support, assistant virtuel...' },
  { value: 'recrutement', label: '👥 Recrutement / RH', desc: 'Screening CV, évaluation candidats...' },
  { value: 'surveillance', label: '👁️ Surveillance / Monitoring', desc: 'Analyse comportementale, modération...' },
  { value: 'autre', label: '📦 Autre usage', desc: 'Non listé ci-dessus' },
]

const FREQUENCES = [
  { value: 'unique', label: 'Usage unique' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'continu', label: 'Continu (24/7)' },
]

const BASES_LEGALES = [
  { value: 'consentement', label: 'Consentement explicite' },
  { value: 'execution_contrat', label: 'Exécution d\'un contrat' },
  { value: 'obligation_legale', label: 'Obligation légale' },
  { value: 'interet_legitime', label: 'Intérêt légitime' },
  { value: 'mission_interet_public', label: 'Mission d\'intérêt public' },
]

type Step = 'identification' | 'classification' | 'donnees' | 'validation'

const STEPS: { id: Step; label: string }[] = [
  { id: 'identification', label: 'Identification' },
  { id: 'classification', label: 'Classification' },
  { id: 'donnees', label: 'Données & RGPD' },
  { id: 'validation', label: 'Validation' },
]

export default function NouveauJournalPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('identification')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    titre: '',
    description: '',
    outil_ia: '',
    outil_ia_custom: '',
    categorie_usage: '',
    frequence_usage: '',
    nb_utilisateurs_concernes: '',
    date_premier_usage: '',
    traite_donnees_perso: false,
    types_donnees_perso: [] as string[],
    base_legale_rgpd: '',
    decision_automatisee: false,
    impact_personnes: false,
    prompt_exemple: '',
  })

  const update = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleDonnee = (type: string) => {
    setForm(prev => ({
      ...prev,
      types_donnees_perso: prev.types_donnees_perso.includes(type)
        ? prev.types_donnees_perso.filter(t => t !== type)
        : [...prev.types_donnees_perso, type]
    }))
  }

  const stepIndex = STEPS.findIndex(s => s.id === step)
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  function nextStep() {
    const steps = STEPS.map(s => s.id)
    const next = steps[stepIndex + 1]
    if (next) setStep(next)
  }

  function prevStep() {
    const steps = STEPS.map(s => s.id)
    const prev = steps[stepIndex - 1]
    if (prev) setStep(prev)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/journaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          nb_utilisateurs_concernes: form.nb_utilisateurs_concernes
            ? parseInt(form.nb_utilisateurs_concernes) : undefined,
          outil_ia: form.outil_ia === 'Custom / Autre' ? 'Custom' : form.outil_ia.split(' (')[0],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }

      router.push('/dashboard/journaux?created=true')
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  // Niveau de risque estimé en temps réel
  const getRisqueEstime = () => {
    if (form.categorie_usage === 'recrutement') return { level: 'Élevé', color: 'text-orange-600 bg-orange-50', info: 'Annexe III AI Act' }
    if (form.categorie_usage === 'decision_automatisee' && form.impact_personnes) return { level: 'Élevé', color: 'text-orange-600 bg-orange-50', info: 'Décision automatisée avec impact' }
    if (form.categorie_usage === 'surveillance') return { level: 'Élevé', color: 'text-orange-600 bg-orange-50', info: 'Usage de surveillance' }
    if (form.categorie_usage === 'interaction_client') return { level: 'Limité', color: 'text-yellow-600 bg-yellow-50', info: 'Obligation de transparence (Art. 50)' }
    if (form.categorie_usage === 'generation_contenu') return { level: 'Faible', color: 'text-green-600 bg-green-50', info: 'Peu de restrictions' }
    if (form.categorie_usage === 'analyse_donnees') return { level: 'Faible', color: 'text-green-600 bg-green-50', info: 'Peu de restrictions' }
    return { level: 'Non classé', color: 'text-slate-600 bg-slate-50', info: 'Sélectionnez une catégorie' }
  }

  const risqueEstime = getRisqueEstime()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/journaux" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Déclarer un usage IA</h1>
          <p className="text-sm text-slate-500">Documentation conforme AI Act européen</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${
                stepIndex > i ? 'bg-green-500 text-white'
                : stepIndex === i ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-500'
              }`}>
                {stepIndex > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                stepIndex >= i ? 'text-slate-700' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${stepIndex > i ? 'bg-green-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ÉTAPE 1 — Identification */}
        {step === 'identification' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Titre de l'usage IA <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required value={form.titre}
                onChange={e => update('titre', e.target.value)}
                placeholder="Ex: Rédaction des newsletters hebdomadaires avec ChatGPT"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Soyez précis — ce titre apparaîtra dans vos rapports de conformité</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description détaillée <span className="text-red-500">*</span>
              </label>
              <textarea
                required value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Décrivez précisément comment l'IA est utilisée : dans quel processus, par qui, avec quelles données en entrée, quel est le résultat produit..."
                rows={4}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Outil IA utilisé <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OUTILS_IA.map(outil => (
                  <button
                    key={outil} type="button"
                    onClick={() => update('outil_ia', outil)}
                    className={`px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
                      form.outil_ia === outil
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {outil}
                  </button>
                ))}
              </div>
              {form.outil_ia === 'Custom / Autre' && (
                <input
                  type="text" value={form.outil_ia_custom}
                  onChange={e => update('outil_ia_custom', e.target.value)}
                  placeholder="Nom de l'outil..."
                  className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fréquence d'usage</label>
                <select
                  value={form.frequence_usage}
                  onChange={e => update('frequence_usage', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner...</option>
                  {FREQUENCES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date premier usage</label>
                <input
                  type="date" value={form.date_premier_usage}
                  onChange={e => update('date_premier_usage', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Classification */}
        {step === 'classification' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Catégorie d'usage <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value} type="button"
                    onClick={() => update('categorie_usage', cat.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-left transition-colors ${
                      form.categorie_usage === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${form.categorie_usage === cat.value ? 'text-blue-700' : 'text-slate-800'}`}>
                      {cat.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Niveau de risque estimé en temps réel */}
            {form.categorie_usage && (
              <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${risqueEstime.color}`}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Risque estimé : {risqueEstime.level}</p>
                  <p className="text-xs mt-0.5 opacity-75">{risqueEstime.info}</p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-sm font-semibold text-slate-700">Questions complémentaires</p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.decision_automatisee}
                  onChange={e => update('decision_automatisee', e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Décision automatisée</p>
                  <p className="text-xs text-slate-500">L'IA prend ou influence directement des décisions</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.impact_personnes}
                  onChange={e => update('impact_personnes', e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Impact sur des personnes physiques</p>
                  <p className="text-xs text-slate-500">Les résultats de l'IA ont un impact direct sur des individus</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Exemple de prompt utilisé <span className="text-slate-400 font-normal">(optionnel mais recommandé)</span>
              </label>
              <textarea
                value={form.prompt_exemple}
                onChange={e => update('prompt_exemple', e.target.value)}
                placeholder="Ex: 'Rédige une newsletter de 300 mots sur le sujet suivant : [SUJET]. Ton professionnel, adapté à nos clients...'"
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">Stocké de manière sécurisée, utile pour les audits</p>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 — Données & RGPD */}
        {step === 'donnees' && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Si l'IA traite des données personnelles, vous devez documenter la base légale selon le RGPD.
                En cas de contrôle, cette documentation est obligatoire.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.traite_donnees_perso}
                onChange={e => update('traite_donnees_perso', e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Cet usage IA traite des données personnelles</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Noms, emails, numéros de téléphone, données de santé, données financières, etc.
                </p>
              </div>
            </label>

            {form.traite_donnees_perso && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Types de données personnelles concernées</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Identité (nom, prénom)', 'Email', 'Téléphone', 'Adresse postale',
                      'Données financières', 'Données de santé', 'Données RH',
                      'Comportement / Navigation', 'Localisation', 'Données sensibles'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs">
                        <input
                          type="checkbox"
                          checked={form.types_donnees_perso.includes(type)}
                          onChange={() => toggleDonnee(type)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Base légale RGPD <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {BASES_LEGALES.map(base => (
                      <label key={base.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.base_legale_rgpd === base.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <input
                          type="radio" name="base_legale"
                          value={base.value}
                          checked={form.base_legale_rgpd === base.value}
                          onChange={e => update('base_legale_rgpd', e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className={`text-sm font-medium ${form.base_legale_rgpd === base.value ? 'text-blue-700' : 'text-slate-700'}`}>
                          {base.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nombre de personnes concernées (estimation)
                  </label>
                  <input
                    type="number" min="1"
                    value={form.nb_utilisateurs_concernes}
                    onChange={e => update('nb_utilisateurs_concernes', e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* ÉTAPE 4 — Validation */}
        {step === 'validation' && (
          <div className="space-y-5">
            <div className="text-center pb-2">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-slate-900">Vérification finale</h2>
              <p className="text-sm text-slate-500">Récapitulatif avant enregistrement</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Titre', value: form.titre },
                { label: 'Outil IA', value: form.outil_ia },
                { label: 'Catégorie', value: CATEGORIES.find(c => c.value === form.categorie_usage)?.label || '-' },
                { label: 'Fréquence', value: FREQUENCES.find(f => f.value === form.frequence_usage)?.label || 'Non renseigné' },
                { label: 'Données personnelles', value: form.traite_donnees_perso ? 'Oui' : 'Non' },
                { label: 'Décision automatisée', value: form.decision_automatisee ? 'Oui' : 'Non' },
                { label: 'Risque estimé', value: risqueEstime.level },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value || '-'}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-600">
                En enregistrant ce journal, vous documentez cet usage IA conformément aux exigences de l'AI Act européen (EU 2024/1689).
                Ce document constitue une preuve en cas de contrôle réglementaire.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
          {!isFirst && (
            <button
              type="button" onClick={prevStep}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
          )}
          <div className="flex-1" />
          {!isLast ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={
                (step === 'identification' && (!form.titre || !form.description || !form.outil_ia)) ||
                (step === 'classification' && !form.categorie_usage)
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button" onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Enregistrement...</>
              ) : (
                <><Save className="w-4 h-4" />Enregistrer le journal</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
