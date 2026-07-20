import { motion } from 'framer-motion'
import { Avatar } from '../../design-system/components/Avatar'
import { Button } from '../../design-system/components/Button'
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
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="surface-elevated rounded-[20px] p-7 mb-10 text-center w-full"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4">
            The Suspicious Echo
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Avatar
              src={echoPlayer.avatar}
              username={echoPlayer.username}
              size="md"
            />
            <span className="text-[16px] font-semibold text-text-primary tracking-[-0.015em]">
              {echoPlayer.username}
            </span>
          </div>
          <div className="divider" />
          <div className="text-[13px] text-text-secondary pt-4 mt-1 tracking-[-0.003em]">
            Their odd word was:{' '}
            <span className="font-mono font-semibold text-text-primary bg-bg-tertiary/40 px-2.5 py-1 rounded-lg uppercase tracking-[0.1em] text-[11px]">
              {echoPlayer.word}
            </span>
          </div>
        </motion.div>
      )}

      {/* Vote results */}
      <div className="w-full space-y-1.5 mb-10">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-text-tertiary mb-4">
          Voting Recap
        </p>
        {sortedPlayers.map((player) => {
          const count = voteCounts.get(player.id) || 0
          const maxVotes = Math.max(...(voteCounts.values()), 0)
          const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0
          const isEcho = player.id === revealedEchoId

          return (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-[14px] px-4 py-3 hover:bg-bg-secondary/30 transition-colors duration-200"
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
                  <div
                    className="h-full rounded-full bg-text-primary/40 transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-text-tertiary tabular-nums w-4 text-right">
                  {count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2.5 w-full">
        <Button
          onClick={onPlayAgain}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Play Again
        </Button>
        <Button
          onClick={onLeave}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          Leave
        </Button>
      </div>
    </motion.div>
  )
}
