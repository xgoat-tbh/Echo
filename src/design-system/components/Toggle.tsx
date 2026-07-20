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
        'group flex w-full items-center justify-between rounded-xl px-4 py-3 border border-transparent transition-all',
        'hover:bg-bg-tertiary/40 hover:border-border/20',
        'disabled:opacity-30 disabled:pointer-events-none',
        'text-left'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-text-primary">{label}</div>
        {description && (
          <div className="text-xs text-text-secondary mt-0.5 font-normal">
            {description}
          </div>
        )}
      </div>
      <div
        className={cn(
          'relative ml-3 flex h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors border',
          checked
            ? 'bg-text-primary border-transparent'
            : 'bg-bg-tertiary border-border/80 group-hover:border-border-hover/80'
        )}
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className={cn(
            'h-3.5 w-3.5 rounded-full shadow-sm',
            checked ? 'bg-bg translate-x-3.5' : 'bg-text-tertiary'
          )}
        />
      </div>
    </button>
  )
}
