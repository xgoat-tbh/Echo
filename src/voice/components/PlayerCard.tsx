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
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative rounded-2xl border p-5 transition-all duration-300',
        player.isSpeaking
          ? 'border-success/30 bg-bg-secondary shadow-[0_0_24px_var(--color-speaking-glow)]'
          : 'border-border/80 bg-bg-secondary/40 hover:border-border-hover/80 hover:bg-bg-secondary/60 backdrop-blur-sm'
      )}
    >
      <div className="flex items-center gap-3 mb-4">
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
            <span className="text-sm font-bold text-text-primary truncate">
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none bg-bg-secondary px-2 py-0.5 rounded border border-border/40">
            You
          </span>
        )}
      </div>

      <div className="h-8 overflow-hidden rounded-lg bg-bg-tertiary/20 border border-border/40 p-1 flex items-center justify-center">
        {player.isLocal ? (
          <WaveformRenderer
            analyser={analyser ?? null}
            width={160}
            height={24}
            isActive={player.isSpeaking}
          />
        ) : (
          <WaveformRenderer
            analyser={null}
            width={160}
            height={24}
            isActive={player.isSpeaking}
          />
        )}
      </div>

      {!player.isLocal && onVolumeChange && (
        <div className="mt-4 border-t border-border/40 pt-3">
          <Slider
            value={volume}
            onChange={onVolumeChange}
            min={0}
            max={200}
            step={1}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
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
