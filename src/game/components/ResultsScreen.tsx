import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Crown, Skull, Swords, Users, Eye } from 'lucide-react'
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
  winnerId: string | null
  onPlayAgain: () => void
  onLeave: () => void
}

export function ResultsScreen({ players, revealedEchoId, votes, winnerId, onPlayAgain, onLeave }: ResultsScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const c = setTimeout(() => setShowConfetti(true), 400)
    return () => clearTimeout(c)
  }, [])

  const echoWon = winnerId === 'ECHO'
  const echoPlayers = players.filter(p => p.isEcho)
  const commonerPlayers = players.filter(p => !p.isEcho)

  const voteCounts = new Map<string, number>()
  votes.forEach(v => voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1))

  const sortedPlayers = [...players].sort((a, b) => (voteCounts.get(b.id) || 0) - (voteCounts.get(a.id) || 0))
  const maxVotes = Math.max(...voteCounts.values(), 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center py-6 px-4 max-w-md mx-auto w-full min-h-full"
    >
      <Confetti show={showConfetti} />

      {/* ─── AMONG US STYLE WINNER BANNER ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'w-full rounded-2xl p-6 text-center relative overflow-hidden mb-6',
          echoWon ? 'bg-error/15' : 'bg-success/15'
        )}
      >
        {/* Pulsing gradient background */}
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0"
          style={{
            background: echoWon
              ? 'radial-gradient(ellipse at center, hsla(358,68%,48%,0.15), transparent 70%)'
              : 'radial-gradient(ellipse at center, hsla(142,52%,42%,0.15), transparent 70%)'
          }}
        />

        {/* Impostor / Crewmate icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, -5, 0] }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 12 }}
          className="relative z-10 mx-auto mb-2"
        >
          {echoWon ? (
            <Eye className="w-10 h-10 text-error mx-auto" />
          ) : (
            <Users className="w-10 h-10 text-success mx-auto" />
          )}
        </motion.div>

        {/* Victory/Defeat */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className={cn(
            'relative z-10 text-[11px] font-extrabold uppercase tracking-[0.25em]',
            echoWon ? 'text-error' : 'text-success'
          )}
        >
          {echoWon ? 'Defeat' : 'Victory'}
        </motion.p>

        {/* Team name */}
        <motion.h2
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-[42px] font-extrabold tracking-[-0.04em] leading-none mt-1 select-none"
          style={{ color: echoWon ? 'var(--color-error)' : 'var(--color-success)' }}
        >
          {echoWon ? 'ECHO' : 'VILLAGERS'}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="relative z-10 text-[12px] text-text-secondary mt-2 font-medium"
        >
          {echoWon
            ? 'The Echo fooled everyone and escaped.'
            : 'The Villagers caught the Echo and restored order.'
          }
        </motion.p>
      </motion.div>

      {/* ─── TEAMS LINEUP (Among Us style) ─── */}
      <div className="w-full mb-6 space-y-3">
        {/* Echoes (Impostors) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2 px-1">
            <Swords className="w-3.5 h-3.5 text-error" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-error">{echoPlayers.length} Impostor{echoPlayers.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {echoPlayers.map((p, idx) => {
              const color = getPlayerColor(p.id, players.indexOf(p))
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8 + idx * 0.08, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[12px] flex-1 min-w-0',
                    p.eliminated ? 'opacity-40' : ''
                  )}
                  style={{ backgroundColor: `${color}10`, borderLeft: `3px solid ${color}` }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                    {p.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-semibold text-text-primary truncate block">{p.nickname}</span>
                    {p.word && <span className="text-[9px] text-text-tertiary font-mono uppercase block truncate">{p.word}</span>}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-error bg-error/10 px-1.5 py-0.5 rounded shrink-0">Echo</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Commoners (Crewmates) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2 px-1">
            <Users className="w-3.5 h-3.5 text-success" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">{commonerPlayers.length} Crewmate{commonerPlayers.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {commonerPlayers.map((p, idx) => {
              const color = getPlayerColor(p.id, players.indexOf(p))
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.0 + idx * 0.05, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[12px] flex-1 min-w-0',
                    p.eliminated ? 'opacity-40' : ''
                  )}
                  style={{ backgroundColor: `${color}08`, borderLeft: `3px solid ${color}60` }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                    {p.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-semibold text-text-primary truncate block">{p.nickname}</span>
                    {p.word && <span className="text-[9px] text-text-tertiary font-mono uppercase block truncate">{p.word}</span>}
                  </div>
                  <span className={cn(
                    'text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded shrink-0',
                    p.eliminated ? 'text-text-tertiary bg-bg-tertiary/30' : 'text-success bg-success/10'
                  )}>
                    {p.eliminated ? 'Ejected' : 'Alive'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ─── VOTE RECAP ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="w-full mb-6"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-3">Voting Recap</p>
        <div className="space-y-1">
          {sortedPlayers.map((player, idx) => {
            const count = voteCounts.get(player.id) || 0
            const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0
            const isEcho = player.isEcho
            const color = getPlayerColor(player.id, idx)

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + idx * 0.04, duration: 0.3 }}
                className="flex items-center gap-3 rounded-[14px] px-4 py-2.5"
                style={isEcho ? { backgroundColor: `${color}08` } : {}}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                  {player.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-[12px] font-semibold min-w-0 truncate" style={{ color: isEcho ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                  {player.nickname}
                </span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="h-[3px] w-14 rounded-full bg-bg-tertiary/60 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ delay: 1.5 + idx * 0.04, duration: 0.5 }}
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

        {/* Vote trail */}
        {votes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.4 }}
            className="mt-3 surface-card rounded-[14px] p-3"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-text-tertiary mb-2">Vote Trail</p>
            <div className="space-y-1">
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
        )}
      </motion.div>

      {/* ─── ACTIONS ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 0.4 }}
        className="flex gap-2.5 w-full"
      >
        <motion.button
          onClick={onPlayAgain}
          whileTap={{ scale: 0.97 }}
          className="flex-1 btn-primary cursor-pointer"
        >
          <Crown className="w-4 h-4" /> Play Again
        </motion.button>
        <motion.button
          onClick={onLeave}
          whileTap={{ scale: 0.97 }}
          className="flex-1 btn-secondary cursor-pointer"
        >
          Leave
        </motion.button>
      </motion.div>
    </motion.div>
  )
}