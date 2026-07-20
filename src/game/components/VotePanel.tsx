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
      <div className="rounded-xl border border-border bg-bg-secondary p-6 text-center">
        <p className="text-sm text-text-secondary">Vote cast. Waiting for others...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-text-primary mb-3">
        Who do you suspect is the Echo?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players
          .filter((p) => p.id !== localPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg border border-border p-3 text-left',
                'hover:border-error/50 hover:bg-error/5 transition-all duration-200',
                'active:scale-[0.98]'
              )}
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="sm"
              />
              <span className="text-sm text-text-primary truncate">
                {player.username}
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}
