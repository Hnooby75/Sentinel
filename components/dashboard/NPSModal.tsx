// ============================================
// components/dashboard/NPSModal.tsx
// Modal NPS mensuel — s'affiche 1x/mois pour plans payants
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'

const LATER_KEY = 'sentinel_nps_later'
const LATER_DAYS = 7

export default function NPSModal() {
  const [visible, setVisible] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [commentaire, setCommentaire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Vérifier "Plus tard"
    const laterStr = localStorage.getItem(LATER_KEY)
    if (laterStr) {
      const laterUntil = new Date(laterStr)
      if (new Date() < laterUntil) return
    }

    // Délai 8 secondes puis vérifier si déjà répondu ce mois
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/nps')
        if (!res.ok) return
        const data = await res.json()
        if (!data.answered) {
          setVisible(true)
        }
      } catch { /* ignore */ }
    }, 8000)

    return () => clearTimeout(timer)
  }, [])

  async function handleSubmit() {
    if (score === null) return
    setSubmitting(true)
    try {
      await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, commentaire }),
      })
      setSubmitted(true)
      setTimeout(() => setVisible(false), 2000)
    } catch { /* ignore */ } finally {
      setSubmitting(false)
    }
  }

  function handleLater() {
    const later = new Date(Date.now() + LATER_DAYS * 24 * 60 * 60 * 1000)
    localStorage.setItem(LATER_KEY, later.toISOString())
    setVisible(false)
  }

  if (!visible) return null

  const scoreColors = (s: number) => {
    if (s <= 3) return 'bg-red-500 hover:bg-red-600 border-red-500'
    if (s <= 6) return 'bg-amber-500 hover:bg-amber-600 border-amber-500'
    return 'bg-green-500 hover:bg-green-600 border-green-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-base">Comment évaluez-vous Sentinel ce mois ?</h2>
            <p className="text-blue-200 text-xs mt-0.5">30 secondes pour nous aider à vous servir mieux</p>
          </div>
          <button onClick={handleLater} className="text-white/60 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-8 text-center">
            <Star className="w-10 h-10 text-amber-400 mx-auto mb-3 fill-amber-400" />
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Merci pour votre retour !</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Votre avis nous aide à améliorer Sentinel.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Score 0-10 */}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                De 0 (pas du tout satisfait) à 10 (très satisfait)
              </p>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setScore(i)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border-2 ${
                      score === i
                        ? `${scoreColors(i)} text-white scale-110 shadow-lg`
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-700'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-slate-400">Pas du tout satisfait</span>
                <span className="text-xs text-slate-400">Très satisfait</span>
              </div>
            </div>

            {/* Commentaire optionnel */}
            <div>
              <textarea
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                placeholder="Un commentaire ? (optionnel)"
                rows={2}
                className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 resize-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSubmit}
                disabled={score === null || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                {submitting ? 'Envoi…' : 'Envoyer mon avis'}
              </button>
              <button
                onClick={handleLater}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 font-medium transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
