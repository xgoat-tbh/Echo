import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { Avatar } from '../../design-system/components/Avatar'
import { getPlayerColor } from '../playerColors'
import type { Player } from '../../store/gameStore'

interface VotePanelProps {
  players: Player[]
  localPlayerId: string | null
  hasVoted: boolean
  onVote: (targetId: string) => void
}

export function VotePanel({ players, localPlayerId, hasVoted, onVote }: VotePanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  if (hasVoted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="surface-card rounded-[18px] p-8 text-center w-full max-w-sm"
      >
        <p className="text-[13px] font-medium text-text-secondary tracking-[-0.003em]">Vote cast. Waiting for other players...</p>
      </motion.div>
    )
  }

  const others = players.filter((p) => p.id !== localPlayerId)

  return (
    <div className="space-y-5 w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary text-center">
        Who do you suspect is the Echo?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
        {others.map((player, idx) => {
          const color = getPlayerColor(player.id, idx)
          const isHovered = hoverId === player.id
          const isDimmed = hoverId !== null && !isHovered
          const isSelected = selectedId === player.id
          return (
            <motion.button
              key={player.id}
              onClick={() => { setSelectedId(player.id); onVote(player.id) }}
              onMouseEnter={() => setHoverId(player.id)}
              onMouseLeave={() => setHoverId(null)}
              whileTap={{ scale: 0.95 }}
              animate={{ opacity: isDimmed ? 0.5 : 1, scale: isSelected ? 0.97 : 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-[16px] surface-card p-5 text-center relative overflow-hidden',
                'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer',
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-bg'
                  : 'hover:-translate-y-0.5 active:translate-y-0'
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 rounded-[16px]"
                  style={{ backgroundColor: `${color}12` }}
                />
              )}
              <div className="relative z-10">
                <Avatar
                  src={player.avatar}
                  username={player.username}
                  size="md"
                />
              </div>
              <span className="text-[13px] font-semibold text-text-primary truncate max-w-full tracking-[-0.006em] relative z-10">
                {player.username}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-[0.12em] z-10"
                  style={{ color }}
                >
                  Selected
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
