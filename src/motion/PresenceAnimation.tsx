import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { Stagger } from '../design-system/tokens/motion'

interface StaggerContainerProps {
  children: ReactNode
}

export function StaggerContainer({ children }: StaggerContainerProps) {
  return (
    <motion.div variants={Stagger.container} initial="initial" animate="animate">
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
}

export function StaggerItem({ children }: StaggerItemProps) {
  return (
    <motion.div variants={Stagger.item} layout>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </motion.div>
  )
}

const joinAnimation = {
  initial: { opacity: 0, scale: 0.92, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: -8 },
  transition: {
    duration: 0.2,
    ease: [0.34, 1.56, 0.64, 1] as const,
  },
}

interface PresenceCardProps {
  children: ReactNode
  id: string
}

export function PresenceCard({ children, id }: PresenceCardProps) {
  return (
    <motion.div
      key={id}
      layout
      initial={joinAnimation.initial}
      animate={joinAnimation.animate}
      exit={joinAnimation.exit}
      transition={{ ...joinAnimation.transition, layout: { duration: 0.3 } }}
    >
      {children}
    </motion.div>
  )
}
