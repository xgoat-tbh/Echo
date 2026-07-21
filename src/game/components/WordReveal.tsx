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
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="surface-elevated rounded-[24px] p-10 text-center max-w-[340px] w-full relative overflow-hidden"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-text-tertiary mb-5">
            Your Secret Word
          </p>
          <div className="divider" />
          <div className="py-7">
            <p className="text-[44px] font-medium font-display italic text-text-primary tracking-normal select-none lowercase leading-none">
              {word}
            </p>
          </div>
          <div className="divider" />
          <p className="text-[12px] text-text-secondary leading-[1.7] font-normal mt-5 tracking-[-0.003em]">
            Describe your word without saying,
            <br />
            spelling, or translating it.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
