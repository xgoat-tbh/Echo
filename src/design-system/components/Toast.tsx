import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '../../lib/cn'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastData {
  id: string
  variant: ToastVariant
  message: string
  action?: { label: string; onClick: () => void }
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-success/20 text-success',
  error: 'border-error/20 text-error',
  info: 'border-border/60 text-text-secondary',
  warning: 'border-warning/20 text-warning',
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-bg-elevated/95 px-4 py-3.5 shadow-2xl backdrop-blur-xl',
        variantStyles[toast.variant]
      )}
    >
      <span className="shrink-0">{icons[toast.variant]}</span>
      <span className="flex-1 text-sm text-text-primary font-medium">{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.onClick}
          className="shrink-0 text-xs font-semibold text-text-primary hover:text-text-secondary transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-tertiary hover:text-text-secondary p-1 rounded-lg hover:bg-bg-tertiary/50 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" /><path d="M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-toast flex flex-col gap-2 w-full max-w-sm px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
