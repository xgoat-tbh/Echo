import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageTransition } from '../../motion/PageTransition'
import { cn } from '../../lib/cn'

interface LobbyPageProps {
  onCreateRoom: () => void
  onJoinRoom: (code: string) => void
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
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
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-5">
          <span className="text-sm font-semibold tracking-tight text-text-primary">
            Echo
          </span>
          <a
            href="https://github.com/xgoat-tbh/Echo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            GitHub
          </a>
        </nav>

        <main className="flex-1 flex flex-col items-center px-6">
          {/* ─── HERO ─── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center text-center pt-16 pb-12 max-w-xl"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-text-primary">
                Echo
              </h1>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-lg text-text-secondary max-w-md"
            >
              One room. One different word.
              <br />
              Can you find the Echo?
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs"
            >
              <button
                onClick={onCreateRoom}
                className={cn(
                  'flex-1 h-12 rounded-xl bg-accent text-text-inverse font-semibold text-sm',
                  'hover:bg-accent-hover transition-all duration-200',
                  'active:scale-[0.98]'
                )}
              >
                Create Room
              </button>

              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Room code"
                  maxLength={8}
                  className={cn(
                    'flex-1 h-12 rounded-xl border border-border bg-transparent px-4 text-sm text-text-primary text-center uppercase tracking-widest',
                    'placeholder:text-text-tertiary placeholder:normal-case placeholder:tracking-normal',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                    'transition-all duration-200'
                  )}
                />
                <button
                  onClick={handleJoin}
                  disabled={!roomCode.trim() || joining}
                  className={cn(
                    'h-12 px-5 rounded-xl border border-border text-text-primary font-medium text-sm',
                    'hover:bg-bg-tertiary transition-all duration-200',
                    'disabled:opacity-40 disabled:pointer-events-none',
                    'active:scale-[0.98]'
                  )}
                >
                  Join
                </button>
              </div>
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-xs text-text-tertiary"
            >
              4–12 players. No downloads. No accounts.
            </motion.p>
          </motion.div>

          {/* ─── HOW TO PLAY ─── */}
          <section className="w-full max-w-2xl py-16">
            <h2 className="text-sm font-semibold text-text-primary text-center mb-10">
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
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-xl border border-border bg-bg-secondary p-5 hover:border-border-hover transition-colors"
                >
                  <span className="text-xs font-mono text-text-tertiary">
                    {item.step}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ─── FEATURES ─── */}
          <section className="w-full max-w-2xl py-16 border-t border-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-6">
              {[
                { icon: MicIcon, label: 'Built-in Voice Chat' },
                { icon: DownloadIcon, label: 'No Downloads' },
                { icon: BrowserIcon, label: 'Instant Browser Play' },
                { icon: PlayersIcon, label: '4–12 Players' },
                { icon: MobileIcon, label: 'Mobile Friendly' },
                { icon: LockIcon, label: 'Private Rooms' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-2.5">
                  <feature.icon />
                  <span className="text-xs text-text-secondary">{feature.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="pb-8 text-center">
            <p className="text-[11px] text-text-tertiary">
              Built for browsers. Made for liars.
            </p>
          </footer>
        </main>
      </div>
    </PageTransition>
  )
}

/* ─── Feature Icons ─── */

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function BrowserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function PlayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
