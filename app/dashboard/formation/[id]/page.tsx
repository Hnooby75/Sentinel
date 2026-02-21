// ============================================
// app/dashboard/formation/[id]/page.tsx
// Feature 5 — Module de formation interactif + quiz
// ============================================
'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, ChevronLeft, Trophy, Clock, Loader2 } from 'lucide-react'

interface Slide {
  type: 'intro' | 'content' | 'summary'
  titre: string
  contenu: string
  points_cles?: string[]
}

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explication: string
}

interface TrainingModule {
  id: string
  titre: string
  description: string
  duree_minutes: number
  points: number
  niveau: string
  contenu: { slides: Slide[] }
  quiz: { questions: QuizQuestion[] }
}

interface Progress {
  statut: string
  score: number | null
}

export default function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [module, setModule] = useState<TrainingModule | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'slides' | 'quiz' | 'result'>('slides')
  const [slideIndex, setSlideIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizScore, setQuizScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/training/${id}`)
      .then(r => r.json())
      .then(data => {
        setModule(data.module)
        setProgress(data.progress)
        if (data.progress?.statut === 'completed') setPhase('result')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function submitQuiz() {
    if (!module) return
    setSubmitting(true)
    const questions = module.quiz.questions

    let correct = 0
    const reponses = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct
      if (isCorrect) correct++
      return { question_index: i, reponse_index: answers[i] ?? -1, correct: isCorrect }
    })

    const score = Math.round((correct / questions.length) * 100)
    setQuizScore(score)

    const res = await fetch(`/api/training/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, reponses }),
    })

    if (res.ok) {
      const data = await res.json()
      setProgress(data.progress)
    }
    setSubmitting(false)
    setPhase('result')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Module introuvable</p>
        <Link href="/dashboard/formation" className="text-blue-600 text-sm mt-2 inline-block">
          ← Retour à la formation
        </Link>
      </div>
    )
  }

  const slides = module.contenu?.slides || []
  const questions = module.quiz?.questions || []
  const currentSlide = slides[slideIndex]
  const allAnswered = questions.every((_, i) => answers[i] !== undefined)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/formation" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{module.titre}</h1>
          <p className="text-xs text-slate-500">{module.duree_minutes} min · {module.points} pts</p>
        </div>
        {progress?.statut === 'completed' && (
          <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
            <CheckCircle className="w-3 h-3" /> Complété · {progress.score}/100
          </span>
        )}
      </div>

      {/* Phase: Slides */}
      {phase === 'slides' && currentSlide && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{slideIndex + 1} / {slides.length}</span>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${
                  i === slideIndex ? 'w-6 bg-blue-500' : i < slideIndex ? 'w-3 bg-blue-200' : 'w-3 bg-slate-200'
                }`} />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">
              {currentSlide.type === 'intro' ? 'Introduction' : currentSlide.type === 'summary' ? 'Récapitulatif' : 'Contenu'}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{currentSlide.titre}</h2>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-wrap">{currentSlide.contenu}</p>
          </div>

          {currentSlide.points_cles && currentSlide.points_cles.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Points clés</p>
              <ul className="space-y-1.5">
                {currentSlide.points_cles.map((pt, i) => (
                  <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
              disabled={slideIndex === 0}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
            {slideIndex < slides.length - 1 ? (
              <button
                onClick={() => setSlideIndex(i => i + 1)}
                className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setPhase('quiz')}
                className="flex items-center gap-1 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Passer au quiz <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phase: Quiz */}
      {phase === 'quiz' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Quiz de validation</p>
              <p className="text-xs text-blue-600">{questions.length} questions · 70/100 requis pour valider</p>
            </div>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-800 mb-3">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                    className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                      answers[qi] === oi
                        ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={!allAnswered || submitting}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            Soumettre mes réponses
          </button>
        </div>
      )}

      {/* Phase: Result */}
      {phase === 'result' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          {(progress?.score ?? quizScore) >= 70 ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-700">Module validé !</h2>
              <p className="text-slate-600 text-sm">Score : <strong>{progress?.score ?? quizScore}/100</strong></p>
              <p className="text-xs text-slate-500">Vous avez gagné des points dans le classement</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-orange-700">Score insuffisant</h2>
              <p className="text-slate-600 text-sm">Score : <strong>{quizScore}/100</strong> · Minimum requis : 70</p>
              <button
                onClick={() => { setPhase('slides'); setSlideIndex(0); setAnswers({}) }}
                className="text-sm text-blue-600 hover:underline"
              >
                Revoir le cours et réessayer
              </button>
            </>
          )}
          <Link
            href="/dashboard/formation"
            className="inline-block mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retour aux modules
          </Link>
        </div>
      )}
    </div>
  )
}
