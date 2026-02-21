'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: any; cls: string }> = {
  success: {
    icon: CheckCircle,
    cls: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200',
  },
  error: {
    icon: AlertCircle,
    cls: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200',
  },
  warning: {
    icon: AlertTriangle,
    cls: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200',
  },
  info: {
    icon: Info,
    cls: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => {
          const cfg = VARIANT_CONFIG[t.variant]
          const Icon = cfg.icon
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto ${cfg.cls}`}
              style={{ animation: 'toast-slide-in 0.2s ease-out' }}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-current opacity-60 hover:opacity-100 flex-shrink-0 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
