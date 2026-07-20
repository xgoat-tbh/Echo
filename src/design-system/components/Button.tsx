import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { MotionTiming } from '../tokens/motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-text-primary text-bg font-semibold hover:bg-accent-hover shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-transparent',
  secondary: 'border border-border/80 bg-bg-secondary/40 text-text-primary hover:bg-bg-tertiary/80 hover:border-border-hover/80 backdrop-blur-sm',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50',
  danger: 'bg-error/12 border border-error/20 text-error hover:bg-error/20 hover:border-error/30',
  icon: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50 border border-transparent',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-[32px] px-3.5 text-xs gap-1.5 rounded-lg tracking-wide',
  md: 'h-[40px] px-5 text-sm gap-2 rounded-xl tracking-normal',
  lg: 'h-[48px] px-6 text-[15px] gap-2.5 rounded-xl tracking-normal',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading,
      fullWidth,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={
          !disabled
            ? { y: -1, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 15 } }
            : undefined
        }
        whileTap={
          !disabled
            ? { scale: 0.97, y: 0, transition: { type: 'spring', stiffness: 500, damping: 20 } }
            : undefined
        }
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-hover/40 focus-visible:border-accent-hover/60',
          'disabled:opacity-30 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          variant !== 'icon' && fullWidth && 'w-full',
          variant === 'icon' && 'h-8 w-8 p-0 rounded-lg flex items-center justify-center',
          className
        )}
        disabled={disabled || loading}
        onClick={props.onClick}
      >
        {loading ? (
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
