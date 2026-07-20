import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function CustomSelect({ options, value, onChange, label, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-text-tertiary mb-1.5">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] text-[12px] font-medium transition-all duration-200 cursor-pointer select-none',
          'bg-bg-tertiary/30 border border-border/60 hover:border-border-hover/50',
          'text-text-primary',
          open && 'border-border-hover/60 bg-bg-tertiary/50'
        )}
      >
        <span className="truncate">{selected?.label || value}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          width="10" height="10" viewBox="0 0 10 10" fill="none"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 left-0 right-0 mt-1 rounded-[12px] bg-bg-secondary border border-border/80 shadow-xl shadow-black/20 overflow-hidden"
          >
            <div className="py-1 max-h-[200px] overflow-y-auto">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-left transition-colors duration-150 cursor-pointer',
                    opt.value === value
                      ? 'text-accent bg-accent/8'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40'
                  )}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-accent shrink-0">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
