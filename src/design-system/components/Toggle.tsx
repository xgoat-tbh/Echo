import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex w-full items-center justify-between rounded-lg px-4 py-3',
        'hover:bg-bg-tertiary transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none',
        'text-left'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        {description && (
          <div className="text-xs text-text-secondary mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div
        className={cn(
          'relative ml-3 flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors',
          checked ? 'bg-accent' : 'bg-bg-tertiary'
        )}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'h-4 w-4 rounded-full shadow-sm',
            checked ? 'bg-white translate-x-4' : 'bg-text-tertiary'
          )}
        />
      </div>
    </button>
  )
}
