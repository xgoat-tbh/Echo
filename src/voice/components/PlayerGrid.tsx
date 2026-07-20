import { AnimatePresence } from 'framer-motion'
import { PlayerCard } from './PlayerCard'
import { PlayerGridSkeleton } from '../../motion/Skeleton'
import type { Player } from '../../store/voiceStore'

interface PlayerGridProps {
  players: Player[]
  volumes: Record<string, number>
  onVolumeChange: (playerId: string, volume: number) => void
  localAnalyser: AnalyserNode | null
  loading?: boolean
}

export function PlayerGrid({
  players,
  volumes,
  onVolumeChange,
  localAnalyser,
  loading,
}: PlayerGridProps) {
  if (loading) {
    return <PlayerGridSkeleton count={6} />
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 border border-border/60 bg-bg-secondary/20 rounded-2xl max-w-sm mx-auto text-center backdrop-blur-sm">
        <div className="h-12 w-12 rounded-full bg-bg-tertiary/60 border border-border/60 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-secondary"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-text-secondary">
          Waiting for other players to join the call...
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      <AnimatePresence mode="popLayout">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            volume={volumes[player.id] ?? 100}
            onVolumeChange={
              player.isLocal
                ? undefined
                : (v) => onVolumeChange(player.id, v)
            }
            analyser={player.isLocal ? localAnalyser : null}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
