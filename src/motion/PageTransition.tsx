import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { pageTransition } from './presets'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
