import { motion, AnimatePresence } from 'framer-motion'

interface WordRevealProps {
  word: string | null
  visible: boolean
}

export function WordReveal({ word, visible }: WordRevealProps) {
  return (
    <AnimatePresence>
      {visible && word && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl border border-border bg-bg-secondary px-6 py-4 text-center"
        >
          <p className="text-[11px] uppercase tracking-widest text-text-tertiary mb-1">
            Your word
          </p>
          <p className="text-2xl font-bold text-text-primary tracking-tight">
            {word}
          </p>
          <p className="text-[11px] text-text-tertiary mt-2">
            Describe it without saying it.
            <br />
            Don't spell it. Don't translate it.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
