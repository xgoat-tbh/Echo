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
          initial={{ opacity: 0, scale: 0.96, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-bg-secondary/40 backdrop-blur-sm p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-text-tertiary mb-3">
            Your Secret Word
          </p>
          <div className="border-y border-border/40 py-5 my-3">
            <p className="text-3xl font-black text-text-primary tracking-widest select-none uppercase">
              {word}
            </p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-normal mt-3">
            Describe your word without saying,
            <br />
            spelling, or translating it.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
