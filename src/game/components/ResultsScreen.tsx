import { motion } from 'framer-motion'
import { Avatar } from '../../design-system/components/Avatar'
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center py-8 px-4"
    >
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-widest text-text-tertiary mb-2">
          Game Over
        </p>
        <h2 className="text-2xl font-bold text-text-primary">
          {echoFound ? 'The Echo was found!' : 'The Echo wins!'}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {echoFound
            ? 'The group voted correctly.'
            : 'The Echo survived another round.'}
        </p>
      </div>

      {echoPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-xl border border-accent/30 bg-accent-subtle p-5 mb-8 text-center"
        >
          <p className="text-[11px] uppercase tracking-widest text-accent mb-2">
            The Echo was
          </p>
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <Avatar
              src={echoPlayer.avatar}
              username={echoPlayer.username}
              size="md"
            />
            <span className="text-base font-semibold text-text-primary">
              {echoPlayer.username}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Their word was: <span className="font-mono text-text-primary">{echoPlayer.word}</span>
          </p>
        </motion.div>
      )}

      {/* Vote results */}
      <div className="w-full max-w-xs space-y-1.5 mb-8">
        <p className="text-[11px] uppercase tracking-widest text-text-tertiary mb-2">
          Votes
        </p>
        {sortedPlayers.map((player) => {
          const count = voteCounts.get(player.id) || 0
          const maxVotes = Math.max(...(voteCounts.values()), 0)
          const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0
          const isEcho = player.id === revealedEchoId

          return (
            <div
              key={player.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 bg-bg-tertiary/50"
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="sm"
              />
              <span className="flex-1 text-sm text-text-primary min-w-0 truncate">
                {player.username}
              </span>
              {isEcho && (
                <span className="text-[10px] uppercase tracking-wider text-accent font-medium">
                  Echo
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-16 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary tabular-nums w-4 text-right">
                  {count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="h-10 rounded-xl bg-accent text-text-inverse font-medium text-sm px-5 hover:bg-accent-hover transition-all active:scale-[0.98]"
        >
          Play Again
        </button>
        <button
          onClick={onLeave}
          className="h-10 rounded-xl border border-border text-text-secondary font-medium text-sm px-5 hover:text-text-primary hover:bg-bg-tertiary transition-all active:scale-[0.98]"
        >
          Leave
        </button>
      </div>
    </motion.div>
  )
}
