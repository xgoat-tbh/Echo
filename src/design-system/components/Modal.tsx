import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useCallback } from 'react'
import { cn } from '../../lib/cn'
import { overlayTransition, panelSlideUp } from '../../motion/presets'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  showCloseButton?: boolean
  closeOnOverlay?: boolean
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/75"
            {...overlayTransition}
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            className={cn(
              'relative w-full rounded-[24px] border border-border',
              'bg-bg-elevated/95 backdrop-blur-xl shadow-2xl',
              sizeStyles[size]
            )}
            {...panelSlideUp}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.015em]">
                {title}
              </h2>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close"
                  className="h-7 w-7 p-0 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
