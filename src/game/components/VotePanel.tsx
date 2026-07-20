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
      <div className="surface-card rounded-[18px] p-8 text-center w-full max-w-sm">
        <p className="text-[13px] font-medium text-text-secondary tracking-[-0.003em]">Vote cast. Waiting for other players...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary text-center">
        Who do you suspect is the Echo?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
        {players
          .filter((p) => p.id !== localPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-[16px] surface-card p-5 text-center',
                'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer',
                'hover:border-[hsla(358,68%,48%,0.2)] hover:bg-[hsla(358,68%,48%,0.03)]',
                'hover:-translate-y-0.5 hover:shadow-[0_4px_16px_hsla(358,68%,48%,0.06)]',
                'active:translate-y-0 active:scale-[0.98]'
              )}
            >
              <Avatar
                src={player.avatar}
                username={player.username}
                size="md"
              />
              <span className="text-[13px] font-semibold text-text-primary truncate max-w-full tracking-[-0.006em]">
                {player.username}
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}
