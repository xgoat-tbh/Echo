import { cn } from '../../lib/cn'
import { Avatar } from '../../design-system/components/Avatar'
import type { Player } from '../../store/gameStore'

interface VotePanelProps {
  players: Player[]
  localPlayerId: string | null
  hasVoted: boolean
  onVote: (targetId: string) => void
}

export function VotePanel({ players, localPlayerId, hasVoted, onVote }: VotePanelProps) {
  if (hasVoted) {
    return (
      <div className="rounded-2xl border border-border bg-bg-secondary/40 backdrop-blur-sm p-6 text-center w-full shadow-inner max-w-sm">
        <p className="text-xs font-semibold text-text-secondary">Vote cast. Waiting for other players...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-tertiary text-center mb-4">
        Who do you suspect is the Echo?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
        {players
          .filter((p) => p.id !== localPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-bg-secondary/30 p-5 text-center transition-all duration-300',
                'hover:border-error/40 hover:bg-error/[0.03] hover:shadow-[0_4px_16px_rgba(239,68,68,0.06)]',
                'active:scale-[0.98]'
              )}
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="md"
              />
              <span className="text-xs font-bold text-text-primary truncate max-w-full">
                {player.username}
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}
