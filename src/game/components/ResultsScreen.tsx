import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '../../design-system/components/Avatar'
import { Button } from '../../design-system/components/Button'
import { Confetti } from './Confetti'
import { getPlayerColor } from '../playerColors'
import type { Player, Vote } from '../../store/gameStore'

interface ResultsScreenProps {
  players: Player[]
  revealedEchoId: string | null
  votes: Vote[]
  onPlayAgain: () => void
  onLeave: () => void
}

export function ResultsScreen({
  players,
  revealedEchoId,
  votes,
  onPlayAgain,
  onLeave,
}: ResultsScreenProps) {
  const [flipped, setFlipped] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 300)
    const c = setTimeout(() => setShowConfetti(true), 800)
    return () => { clearTimeout(t); clearTimeout(c) }
  }, [])

  const echoPlayer = players.find((p) => p.id === revealedEchoId)
  const echoFound = revealedEchoId !== null

  const voteCounts = new Map<string, number>()
  votes.forEach((v) => {
    voteCounts.set(v.targetId, (voteCounts.get(v.targetId) || 0) + 1)
  })

  const sortedPlayers = [...players].sort(
    (a, b) => (voteCounts.get(b.id) || 0) - (voteCounts.get(a.id) || 0)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 px-4 max-w-md mx-auto w-full"
    >
      <Confetti show={showConfetti} />

      <div className="text-center mb-10">
        <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-text-tertiary mb-3">
          Game Over
        </p>
        <h2 className="text-[28px] font-extrabold text-text-primary tracking-[-0.03em] select-none leading-tight">
          {echoFound ? 'The Echo was found!' : 'The Echo wins!'}
        </h2>
        <p className="text-[13px] text-text-secondary mt-3 tracking-[-0.003em] leading-[1.6]">
          {echoFound
            ? 'The group successfully detected the imposter.'
            : 'The Echo successfully hid in plain sight.'}
        </p>
      </div>

      {echoPlayer && (
        <div className="mb-10 w-full perspective-[1000px]" style={{ perspective: '1000px' }}>
          <motion.div
            initial={{ opacity: 0, rotateY: flipped ? 180 : 0 }}
            animate={{ opacity: 1, rotateY: flipped ? 0 : 180 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full"
          >
            {/* Front face - hidden when not flipped */}
            <div
              className="surface-elevated rounded-[20px] p-7 text-center w-full relative overflow-hidden"
              style={{ backfaceVisibility: 'hidden', position: flipped ? 'absolute' : 'relative', inset: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -inset-1 rounded-[20px] opacity-30 animate-pulse" style={{ boxShadow: '0 0 30px hsla(358,68%,48%,0.15), inset 0 0 30px hsla(358,68%,48%,0.05)' }} />
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4 relative z-10">
                Who was the Echo?
              </p>
              <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
                <Avatar
                  src={echoPlayer.avatar}
                  username={echoPlayer.username}
                  size="md"
                />
                <span className="text-[16px] font-semibold text-text-primary tracking-[-0.015em]">
                  {echoPlayer.username}
                </span>
              </div>
              <p className="text-[12px] text-text-tertiary relative z-10">Flip to reveal</p>
            </div>

            {/* Back face - shown when flipped */}
            <div
              className="surface-elevated rounded-[20px] p-7 text-center w-full relative overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'relative', inset: 0 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -inset-1 rounded-[20px] opacity-30 animate-pulse" style={{ boxShadow: '0 0 30px hsla(358,68%,48%,0.15), inset 0 0 30px hsla(358,68%,48%,0.05)' }} />
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4 relative z-10">
                The Suspicious Echo
              </p>
              <div className="flex items-center justify-center gap-3 mb-4 relative z-10">
                <Avatar
                  src={echoPlayer.avatar}
                  username={echoPlayer.username}
                  size="md"
                />
                <span className="text-[16px] font-semibold text-text-primary tracking-[-0.015em]">
                  {echoPlayer.username}
                </span>
              </div>
              <div className="divider relative z-10" />
              <div className="text-[13px] text-text-secondary pt-4 mt-1 tracking-[-0.003em] relative z-10">
                Their odd word was:{' '}
                <span className="font-mono font-semibold text-text-primary bg-bg-tertiary/40 px-2.5 py-1 rounded-lg uppercase tracking-[0.1em] text-[11px]">
                  {echoPlayer.word}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Vote results */}
      <div className="w-full space-y-1.5 mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4">
          Voting Recap
        </p>
        {sortedPlayers.map((player, idx) => {
          const count = voteCounts.get(player.id) || 0
          const maxVotes = Math.max(...(voteCounts.values()), 0)
          const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0
          const isEcho = player.id === revealedEchoId
          const color = getPlayerColor(player.id, idx)

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 rounded-[14px] px-4 py-3 transition-colors duration-200"
              style={isEcho ? { backgroundColor: `${color}08` } : {}}
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="sm"
              />
              <span className="flex-1 text-[13px] font-semibold text-text-primary min-w-0 truncate tracking-[-0.006em]">
                {player.username}
              </span>
              {isEcho && (
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] bg-error/8 text-error/80 px-2.5 py-1 rounded-md shrink-0">
                  Echo
                </span>
              )}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="h-[3px] w-16 rounded-full bg-bg-tertiary/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.3 + idx * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-text-primary/40"
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-text-tertiary tabular-nums w-4 text-right">
                  {count}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex gap-2.5 w-full">
        <Button onClick={onPlayAgain} variant="primary" size="lg" className="flex-1">
          Play Again
        </Button>
        <Button onClick={onLeave} variant="secondary" size="lg" className="flex-1">
          Leave
        </Button>
      </div>
    </motion.div>
  )
}
