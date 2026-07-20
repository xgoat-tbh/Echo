import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'

interface SelectOption {
  value: string
  label: string
  group?: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function Select({
  value,
  options,
  onChange,
  label,
  placeholder = 'Select...',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val)
      setOpen(false)
    },
    [onChange]
  )

  return (
    <div ref={ref} className="relative">
      {label && (
        <div className="text-xs font-medium text-text-primary mb-1.5">
          {label}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm',
          'border-border bg-transparent text-text-primary',
          'hover:border-border-hover transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
        )}
      >
        <span className={cn(!selected && 'text-text-tertiary')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-text-secondary transition-transform',
            open && 'rotate-180'
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              'absolute z-dropdown mt-1 w-full rounded-lg border border-border py-1',
              'bg-bg-elevated shadow-lg backdrop-blur-xl'
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-sm transition-colors',
                  option.value === value
                    ? 'bg-accent-subtle text-accent'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
