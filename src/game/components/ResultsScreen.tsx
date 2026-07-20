import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, X, Eye, EyeOff, Swords } from 'lucide-react'
import { Confetti } from './Confetti'
import { getPlayerColor } from '../playerColors'
import { cn } from '../../lib/cn'

interface PlayerResult {
  id: string
  nickname: string
  word: string | null
  isEcho: boolean
  eliminated: boolean
}

interface VoteResult {
  voterId: string
  targetId: string
}

interface ResultsScreenProps {
  players: PlayerResult[]
  revealedEchoId: string | null
  votes: VoteResult[]
  onPlayAgain: () => void
  onLeave: () => void
}

export function ResultsScreen({ players, revealedEchoId, votes, onPlayAgain, onLeave }: ResultsScreenProps) {
  const [flipped, setFlipped] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 300)
    const c = setTimeout(() => setShowConfetti(true), 800)
    return () => { clearTimeout(t); clearTimeout(c) }
  }, [])

  const echoPlayer = players.find(p => p.id === revealedEchoId)
  const echoFound = revealedEchoId !== null

  const voteCounts = new Map<string, number>()
  votes.forEach(v => {
    voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1)
  })

  const sortedPlayers = [...players].sort((a, b) => (voteCounts.get(b.id) || 0) - (voteCounts.get(a.id) || 0))
  const maxVotes = Math.max(...voteCounts.values(), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 px-4 max-w-md mx-auto w-full"
    >
      <Confetti show={showConfetti} />

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-text-tertiary mb-3">Game Over</p>
        <h2 className="text-[28px] font-extrabold tracking-[-0.03em] select-none leading-tight" style={{ color: echoFound ? 'var(--color-text-primary)' : 'var(--color-error)' }}>
          {echoFound ? 'Villagers Win!' : 'Echo Wins!'}
        </h2>
        <p className="text-[13px] text-text-secondary mt-2 tracking-[-0.003em]">
          {echoFound ? 'The Echo was caught red-handed.' : 'The Echo escaped undetected.'}
        </p>
      </div>

      {/* Echo reveal card */}
      <div className="w-full mb-6 perspective-[1000px]">
        <div className="relative w-full" style={{ perspective: '1000px' }}>
          <motion.div
            initial={{ opacity: 0, rotateY: 180 }}
            animate={{ opacity: 1, rotateY: flipped ? 0 : 180 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front — question */}
            <div
              className="surface-elevated rounded-[20px] p-7 text-center w-full relative overflow-hidden"
              style={{ backfaceVisibility: 'hidden', position: flipped ? 'absolute' : 'relative', inset: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4 relative z-10">
                Who was the Echo?
              </p>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-[22px] font-bold" style={{ backgroundColor: `${getPlayerColor(echoPlayer?.id || '', 0)}20`, color: getPlayerColor(echoPlayer?.id || '', 0) }}>
                  {echoPlayer?.nickname?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-[16px] font-semibold text-text-primary tracking-[-0.015em]">
                  {echoPlayer?.nickname || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Back — revealed */}
            <div
              className="surface-elevated rounded-[20px] p-7 text-center w-full relative overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'relative', inset: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -inset-1 rounded-[20px] opacity-30" style={{ boxShadow: '0 0 40px hsla(358,68%,48%,0.2), inset 0 0 40px hsla(358,68%,48%,0.05)' }} />
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4 relative z-10">
                The Echo
              </p>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-[22px] font-bold ring-2 ring-error/30" style={{ backgroundColor: `${getPlayerColor(echoPlayer?.id || '', 0)}20`, color: getPlayerColor(echoPlayer?.id || '', 0) }}>
                  {echoPlayer?.nickname?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-[16px] font-semibold text-text-primary tracking-[-0.015em]">{echoPlayer?.nickname || 'Unknown'}</span>
                {echoPlayer?.word && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-text-tertiary mb-2">Their odd word</p>
                    <span className="font-mono font-bold text-[18px] text-error tracking-[0.08em] uppercase">{echoPlayer.word}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* All players revealed */}
      <div className="w-full mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-3">All Players</p>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p, idx) => {
            const isEcho = p.id === revealedEchoId
            const color = getPlayerColor(p.id, idx)
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={cn(
                  'rounded-[14px] p-3 flex items-center gap-2.5 transition-all duration-300',
                  isEcho ? 'ring-1 ring-error/30' : 'ring-1 ring-border/40'
                )}
                style={{
                  backgroundColor: isEcho ? `${color}08` : 'var(--color-bg-tertiary)',
                  opacity: p.eliminated && !isEcho ? 0.4 : 1,
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                  {p.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-text-primary truncate">{p.nickname}</span>
                    {isEcho && <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-error bg-error/10 px-1.5 py-0.5 rounded shrink-0">Echo</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {p.word ? (
                      <span className="text-[10px] font-mono font-semibold text-text-secondary uppercase">{p.word}</span>
                    ) : (
                      <span className="text-[10px] text-text-tertiary italic">Eliminated</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Vote breakdown — who voted for whom */}
      <div className="w-full mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-3">Voting Recap</p>
        <div className="space-y-1">
          {sortedPlayers.map((player, idx) => {
            const count = voteCounts.get(player.id) || 0
            const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0
            const isEcho = player.id === revealedEchoId
            const color = getPlayerColor(player.id, idx)
            const votedBy = votes.filter(v => v.targetId === player.id).map(v => players.find(p => p.id === v.voterId)?.nickname || 'Unknown')

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.4 }}
                className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                style={isEcho ? { backgroundColor: `${color}08` } : {}}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <span className={cn('flex-1 text-[13px] font-semibold min-w-0 truncate', isEcho ? 'text-error' : 'text-text-primary')}>
                  {player.nickname}
                </span>
                {isEcho && (
                  <span className="text-[8px] font-bold uppercase tracking-[0.12em] bg-error/10 text-error/80 px-2 py-0.5 rounded shrink-0">Echo</span>
                )}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="h-[3px] w-16 rounded-full bg-bg-tertiary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 0.3 + idx * 0.06, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: isEcho ? 'var(--color-error)' : 'var(--color-text-primary)' }}
                    />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-text-tertiary tabular-nums w-4 text-right">{count}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
        {/* Who voted for whom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-3 surface-card rounded-[14px] p-3"
        >
          <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-text-tertiary mb-2">Vote Trail</p>
          <div className="space-y-1">
            {votes.length === 0 && <p className="text-[11px] text-text-tertiary italic">No votes were cast</p>}
            {votes.map((v, i) => {
              const voter = players.find(p => p.id === v.voterId)
              const target = players.find(p => p.id === v.targetId)
              if (!voter || !target) return null
              return (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="font-semibold" style={{ color: getPlayerColor(voter.id, players.indexOf(voter)) }}>{voter.nickname}</span>
                  <span className="text-text-tertiary">→</span>
                  <span className="font-semibold" style={{ color: getPlayerColor(target.id, players.indexOf(target)) }}>{target.nickname}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 w-full">
        <motion.button
          onClick={onPlayAgain}
          whileTap={{ scale: 0.97 }}
          className="flex-1 btn-primary cursor-pointer"
        >
          <Trophy className="w-4 h-4" /> Play Again
        </motion.button>
        <motion.button
          onClick={onLeave}
          whileTap={{ scale: 0.97 }}
          className="flex-1 btn-secondary cursor-pointer"
        >
          Leave
        </motion.button>
      </div>
    </motion.div>
  )
}