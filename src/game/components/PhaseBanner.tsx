import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PhaseBannerProps {
  phase: string
  show: boolean
  onDone?: () => void
}

const phaseNames: Record<string, { title: string; subtitle: string }> = {
  ASSIGNING: { title: 'Assigning Words', subtitle: 'Check your secret word' },
  CLUE: { title: 'Clue Phase', subtitle: 'Give one clue about your word' },
  DISCUSSION: { title: 'Discussion', subtitle: 'Debate who sounds suspicious' },
  VOTING: { title: 'Voting', subtitle: 'Who is the Echo?' },
  REVEAL: { title: 'Reveal', subtitle: 'The votes are in...' },
}

export function PhaseBanner({ phase, show, onDone }: PhaseBannerProps) {
  const info = phaseNames[phase] || { title: phase, subtitle: '' }

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-0 z-30 flex items-center justify-center py-8 bg-gradient-to-b from-bg/90 to-transparent pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-text-tertiary mb-2">{info.subtitle}</p>
            <p className="text-[28px] font-extrabold text-text-primary tracking-[-0.03em]">{info.title}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
