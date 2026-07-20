import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageTransition } from '../../motion/PageTransition'
import { Button } from '../../design-system/components/Button'
import { cn } from '../../lib/cn'

interface LobbyPageProps {
  onCreateRoom: () => void
  onJoinRoom: (code: string) => void
}

const fadeUp = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export function LobbyPage({ onCreateRoom, onJoinRoom }: LobbyPageProps) {
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = () => {
    if (!roomCode.trim()) return
    setJoining(true)
    onJoinRoom(roomCode.trim())
  }

  return (
    <PageTransition>
      <div className="flex h-full flex-col overflow-y-auto bg-bg">
        <main className="flex-1 flex flex-col items-center px-6 justify-center max-w-3xl mx-auto w-full">
          {/* ─── HERO ─── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center text-center pt-20 pb-10 max-w-xl"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-text-primary select-none uppercase">
                Echo
              </h1>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-base sm:text-[17px] text-text-secondary max-w-sm leading-relaxed"
            >
              One room. One different word.
              <br />
              Can you find the Echo?
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-md bg-bg-secondary/30 border border-border/60 p-2 rounded-2xl backdrop-blur-sm"
            >
              <Button
                onClick={onCreateRoom}
                variant="primary"
                size="lg"
                className="flex-1 font-semibold text-sm"
              >
                Create Room
              </Button>

              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Room code"
                  maxLength={8}
                  className={cn(
                    'flex-1 h-[48px] rounded-xl border border-border/80 bg-bg-tertiary/40 px-4 text-center uppercase tracking-[0.2em] font-mono text-sm text-text-primary transition-all duration-300',
                    'placeholder:text-text-tertiary placeholder:normal-case placeholder:tracking-normal placeholder:font-sans',
                    'focus:outline-none focus:ring-2 focus:ring-accent-hover/20 focus:border-text-primary/40 focus:bg-bg-tertiary/60',
                    'hover:border-border-hover/80'
                  )}
                />
                <Button
                  onClick={handleJoin}
                  disabled={!roomCode.trim() || joining}
                  variant="secondary"
                  size="lg"
                  className="font-semibold px-6"
                >
                  Join
                </Button>
              </div>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase"
            >
              4–12 players · No downloads · Private rooms
            </motion.p>
          </motion.div>

          {/* ─── HOW TO PLAY ─── */}
          <section className="w-full py-12 border-t border-border/50">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary text-center mb-8">
              How to Play
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  step: '01',
                  title: 'Receive your word',
                  desc: 'Everyone gets the same secret word. One player gets a different but closely related word.',
                },
                {
                  step: '02',
                  title: 'Describe it',
                  desc: 'Each player gives one clue. Never say your actual word, spell it, or translate it.',
                },
                {
                  step: '03',
                  title: 'Discuss & vote',
                  desc: 'After all clues are heard, debate who sounds suspicious. Vote out the player you suspect.',
                },
                {
                  step: '04',
                  title: 'Find the Echo',
                  desc: 'If the odd player is voted out, everyone wins. If they survive, the Echo wins.',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl border border-border/60 bg-bg-secondary/40 p-6 flex flex-col gap-2 hover:border-border-hover/60 hover:bg-bg-secondary/70 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center border-b border-border/40 pb-2 w-full group-hover:border-border-hover/40 transition-colors">
                    <span className="text-[11px] font-mono text-text-tertiary font-bold tracking-widest uppercase">
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ─── FEATURES ─── */}
          <section className="w-full py-10 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
              {[
                { icon: MicIcon, label: 'Built-in Voice Chat' },
                { icon: DownloadIcon, label: 'No Downloads' },
                { icon: BrowserIcon, label: 'Instant Browser Play' },
                { icon: PlayersIcon, label: '4–12 Players' },
                { icon: MobileIcon, label: 'Mobile Friendly' },
                { icon: LockIcon, label: 'Private Rooms' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-bg-secondary/30 transition-colors duration-200">
                  <feature.icon />
                  <span className="text-xs font-semibold text-text-secondary tracking-wide">{feature.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="w-full mt-auto pb-8 pt-12 flex flex-col items-center gap-3 border-t border-border/30">
            <p className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase">
              Built for browsers · Made for liars
            </p>
            <a
              href="https://github.com/xgoat-tbh/Echo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-secondary transition-colors p-1"
              aria-label="GitHub Repository"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
          </footer>
        </main>
      </div>
    </PageTransition>
  )
}

/* ─── Feature Icons (Muted to text-text-secondary/text-text-tertiary) ─── */

function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function BrowserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function PlayersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
