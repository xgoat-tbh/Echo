import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiProps {
  show: boolean
  duration?: number
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8A5C', '#A8E6CF', '#FCBAD3']

export function Confetti({ show, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; rotation: number; scale: number }[]>([])

  useEffect(() => {
    if (!show) {
      setParticles([])
      return
    }
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 720,
      scale: 0.3 + Math.random() * 0.7,
    }))
    setParticles(p)
    const t = setTimeout(() => setParticles([]), duration)
    return () => clearTimeout(t)
  }, [show, duration])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0, scale: p.scale }}
              animate={{ opacity: 0, y: '100vh', rotate: p.rotation }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 + Math.random(), delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 w-2 h-2 rounded-sm"
              style={{ backgroundColor: p.color, left: 0 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
