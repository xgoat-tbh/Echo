import { motion } from 'framer-motion'
import { Avatar } from '../../design-system/components/Avatar'
import { Slider } from '../../design-system/components/Slider'
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator'
import { WaveformRenderer } from './WaveformRenderer'
import { cn } from '../../lib/cn'
import type { Player, ConnectionGrade } from '../../store/voiceStore'

interface PlayerCardProps {
  player: Player
  volume?: number
  onVolumeChange?: (volume: number) => void
  analyser?: AnalyserNode | null
}

export function PlayerCard({
  player,
  volume = 100,
  onVolumeChange,
  analyser,
}: PlayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      className={cn(
        'relative rounded-lg border p-4 transition-colors',
        player.isSpeaking
          ? 'border-accent/50 bg-bg-secondary shadow-[0_0_20px_var(--color-speaking-glow),0_0_40px_var(--color-speaking-glow)]'
          : 'border-border bg-bg-secondary hover:border-border-hover'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={player.avatar}
          username={player.username}
          size="md"
          isSpeaking={player.isSpeaking}
          isMuted={player.isMuted}
          status={
            player.connectionQuality === 'connecting'
              ? 'connecting'
              : 'online'
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {player.username}
            </span>
            {player.isSpeaking && (
              <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
            )}
          </div>
          <ConnectionQualityIndicator
            grade={player.connectionQuality as ConnectionGrade}
          />
        </div>
        {player.isLocal && (
          <span className="text-[10px] uppercase tracking-wide text-text-tertiary">
            You
          </span>
        )}
      </div>

      <div className="h-8 overflow-hidden rounded-sm">
        {player.isLocal ? (
          <WaveformRenderer
            analyser={analyser ?? null}
            width={160}
            height={32}
            isActive={player.isSpeaking}
          />
        ) : (
          <WaveformRenderer
            analyser={null}
            width={160}
            height={32}
            isActive={player.isSpeaking}
          />
        )}
      </div>

      {!player.isLocal && onVolumeChange && (
        <div className="mt-3">
          <Slider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={200}
            step={1}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            }
          />
        </div>
      )}
    </motion.div>
  )
}
