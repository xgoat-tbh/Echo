import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/cn'

interface CustomWordsModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (pairs: { word: string; echo: string }[]) => void
  currentPairs: number
}

export function CustomWordsModal({ open, onClose, onSubmit, currentPairs }: CustomWordsModalProps) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<{ word: string; echo: string }[]>([])
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseText = (input: string) => {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    const pairs: { word: string; echo: string }[] = []
    const errors: string[] = []

    lines.forEach((line, i) => {
      const parts = line.split(/[|,;/]\s*/).map(s => s.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        pairs.push({ word: parts[0], echo: parts[1] })
      } else {
        errors.push(`Line ${i + 1}: invalid format`)
      }
    })

    return { pairs, errors }
  }

  const handleTextChange = (val: string) => {
    setText(val)
    setError('')
    setSubmitted(false)
    if (val.trim()) {
      const { pairs, errors } = parseText(val)
      setParsed(pairs)
      if (errors.length > 0 && pairs.length === 0) {
        setError(errors[0])
      }
    } else {
      setParsed([])
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (content) {
        handleTextChange(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmit = () => {
    if (parsed.length < 1) return
    onSubmit(parsed)
    setSubmitted(true)
    setTimeout(() => {
      onClose()
      setSubmitted(false)
      setText('')
      setParsed([])
    }, 1200)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg surface-elevated rounded-[24px] p-6 max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.015em]">Custom Word Pairs</h2>
              <button onClick={onClose} className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-text-secondary mb-4 leading-[1.6]">
              Add your own word pairs. One pair per line: <span className="font-mono text-accent">word, echo</span>
            </p>

            <div className="flex gap-2 mb-3">
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-all duration-200 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload .txt
              </button>
              <span className="text-[11px] text-text-tertiary self-center">or type below</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`cat, lion\ndog, wolf\nrose, tulip\n...`}
              className="w-full h-48 input-premium !py-3 !px-4 !rounded-[14px] resize-none text-[13px] font-mono leading-[1.7] placeholder:text-text-tertiary/50"
            />

            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-error font-medium">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-text-tertiary font-medium">
                {parsed.length > 0 ? `${parsed.length} pair${parsed.length > 1 ? 's' : ''} parsed` : 'No pairs yet'}
              </span>
            </div>

            {parsed.length > 0 && (
              <div className="mt-2 max-h-[120px] overflow-y-auto space-y-0.5 pr-1">
                {parsed.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-tertiary/20 text-[11px] font-mono">
                    <span className="text-accent">{p.word}</span>
                    <span className="text-text-tertiary">→</span>
                    <span className="text-text-primary">{p.echo}</span>
                  </div>
                ))}
                {parsed.length > 20 && (
                  <div className="text-[10px] text-text-tertiary text-center pt-1">+{parsed.length - 20} more</div>
                )}
              </div>
            )}

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={onClose}
                className="flex-1 btn-secondary !h-[44px] !text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={parsed.length < 1 || submitted}
                className={cn(
                  'flex-1 !h-[44px] !text-[13px] font-bold rounded-[14px] transition-all duration-200 cursor-pointer',
                  submitted
                    ? 'bg-success text-white'
                    : parsed.length >= 1
                      ? 'bg-accent text-white hover:brightness-110'
                      : 'bg-bg-tertiary/30 text-text-tertiary cursor-not-allowed'
                )}
              >
                {submitted ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Saved
                  </span>
                ) : (
                  `Save ${parsed.length > 0 ? `${parsed.length} Pair${parsed.length > 1 ? 's' : ''}` : 'Pairs'}`
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}