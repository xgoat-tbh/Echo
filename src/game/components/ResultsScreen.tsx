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
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 px-4 max-w-md mx-auto w-full"
    >
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-text-tertiary mb-2">
          Game Over
        </p>
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight select-none">
          {echoFound ? 'The Echo was found!' : 'The Echo wins!'}
        </h2>
        <p className="text-xs text-text-secondary mt-2">
          {echoFound
            ? 'The group successfully detected the imposter.'
            : 'The Echo successfully hid in plain sight.'}
        </p>
      </div>

      {echoPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-bg-secondary/40 backdrop-blur-sm p-6 mb-8 text-center w-full shadow-2xl"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-text-tertiary mb-3.5">
            The Suspicious Echo
          </p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Avatar
              src={echoPlayer.avatar}
              username={echoPlayer.username}
              size="md"
            />
            <span className="text-base font-bold text-text-primary tracking-tight">
              {echoPlayer.username}
            </span>
          </div>
          <div className="text-xs text-text-secondary border-t border-border/40 pt-3 mt-3">
            Their odd word was:{' '}
            <span className="font-mono font-bold text-text-primary bg-bg px-2 py-0.5 rounded border border-border/40 uppercase tracking-widest text-[11px]">
              {echoPlayer.word}
            </span>
          </div>
        </motion.div>
      )}

      {/* Vote results */}
      <div className="w-full space-y-2 mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-text-tertiary mb-3">
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
              className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-bg-secondary/20 border border-border/40 hover:bg-bg-secondary/40 hover:border-border-hover/40 transition-all duration-300"
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="sm"
              />
              <span className="flex-1 text-xs font-bold text-text-primary min-w-0 truncate">
                {player.username}
              </span>
              {isEcho && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-error/12 border border-error/20 text-error px-2 py-0.5 rounded-md shrink-0">
                  Echo
                </span>
              )}
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-1.5 w-16 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-text-primary transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-text-secondary tabular-nums w-4 text-right">
                  {count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 w-full">
        <Button
          onClick={onPlayAgain}
          variant="primary"
          size="lg"
          className="flex-1 font-semibold"
        >
          Play Again
        </Button>
        <Button
          onClick={onLeave}
          variant="secondary"
          size="lg"
          className="flex-1 font-semibold"
        >
          Leave
        </Button>
      </div>
    </motion.div>
  )
}
