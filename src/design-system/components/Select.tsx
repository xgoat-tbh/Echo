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
          'flex h-[40px] w-full items-center justify-between rounded-xl border px-4 text-sm transition-all',
          'border-border/80 bg-bg-secondary/40 text-text-primary backdrop-blur-sm',
          'hover:border-border-hover/80 hover:bg-bg-tertiary/40',
          'focus:outline-none focus:ring-2 focus:ring-accent-hover/30'
        )}
      >
        <span className={cn(!selected && 'text-text-tertiary')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-text-secondary transition-transform duration-200',
            open && 'rotate-180 text-text-primary'
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
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute z-dropdown mt-1.5 w-full rounded-xl border border-border/80 py-1.5 overflow-hidden',
              'bg-bg-elevated/95 shadow-xl backdrop-blur-xl'
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'flex w-full items-center px-4 py-2.5 text-sm transition-colors text-left',
                  option.value === value
                    ? 'bg-accent-subtle text-text-primary font-semibold'
                    : 'text-text-secondary hover:bg-bg-tertiary/80 hover:text-text-primary'
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
