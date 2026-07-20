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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary"
          >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary">
          Waiting for players to join...
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
