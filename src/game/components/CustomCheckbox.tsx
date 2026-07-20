import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface CustomCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function CustomCheckbox({ checked, onChange, label, disabled }: CustomCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'flex items-center gap-2.5 select-none transition-all duration-200',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'relative w-[18px] h-[18px] rounded-[6px] border-2 flex items-center justify-center transition-all duration-200 shrink-0',
          checked
            ? 'bg-accent border-accent'
            : 'bg-bg-tertiary/30 border-border/70 hover:border-border-hover/50'
        )}
      >
        <motion.svg
          initial={false}
          animate={checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          width="10" height="8" viewBox="0 0 10 8" fill="none"
          className="absolute"
        >
          <motion.path
            d="M1 4L3.5 6.5L9 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.svg>
      </div>
      {label && <span className="text-[12px] font-medium text-text-secondary">{label}</span>}
    </button>
  )
}
