import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

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
  primary: [
    'bg-text-primary text-bg font-semibold',
    'shadow-[0_1px_2px_hsla(0,0%,0%,0.4),0_4px_12px_-2px_hsla(0,0%,0%,0.2),inset_0_1px_0_hsla(0,0%,100%,0.06)]',
    'hover:bg-accent-hover',
    'active:shadow-[0_1px_2px_hsla(0,0%,0%,0.4),inset_0_1px_0_hsla(0,0%,100%,0.04)]',
    'border border-transparent',
  ].join(' '),
  secondary: [
    'bg-[hsla(240,6%,8%,0.6)] text-text-primary font-medium',
    'border border-[hsla(240,5%,90%,0.06)]',
    'shadow-[0_1px_3px_hsla(0,0%,0%,0.2)]',
    'hover:bg-[hsla(240,6%,10%,0.7)] hover:border-[hsla(240,5%,90%,0.1)]',
    'active:bg-[hsla(240,6%,8%,0.8)]',
  ].join(' '),
  ghost: [
    'text-text-secondary font-medium',
    'hover:text-text-primary hover:bg-bg-tertiary/40',
    'active:bg-bg-tertiary/50',
  ].join(' '),
  danger: [
    'bg-error/8 text-error/80 font-medium',
    'hover:bg-error/12 hover:text-error',
    'active:bg-error/16',
  ].join(' '),
  icon: [
    'text-text-secondary',
    'hover:text-text-primary hover:bg-bg-tertiary/40',
    'active:bg-bg-tertiary/50',
    'border border-transparent',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-[34px] px-3.5 text-[12px] gap-1.5 rounded-[10px] tracking-[0.01em]',
  md: 'h-[42px] px-5 text-[13px] gap-2 rounded-[12px] tracking-[0.005em]',
  lg: 'h-[52px] px-7 text-[14px] gap-2.5 rounded-[14px] tracking-[0.005em]',
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
            ? { y: -1, transition: { type: 'spring', stiffness: 400, damping: 20, mass: 0.8 } }
            : undefined
        }
        whileTap={
          !disabled
            ? { y: 0, scale: 0.98, transition: { type: 'spring', stiffness: 500, damping: 25, mass: 0.5 } }
            : undefined
        }
        className={cn(
          'inline-flex items-center justify-center select-none cursor-pointer',
          'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(0,0%,96%,0.15)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:opacity-25 disabled:pointer-events-none disabled:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          variant !== 'icon' && fullWidth && 'w-full',
          variant === 'icon' && 'h-8 w-8 p-0 rounded-[10px] flex items-center justify-center',
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
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3.5"
            />
            <path
              className="opacity-80"
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
