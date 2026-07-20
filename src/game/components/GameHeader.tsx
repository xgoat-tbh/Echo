import { motion } from 'framer-motion'
import type { GamePhase } from '../../store/gameStore'
import { cn } from '../../lib/cn'

interface GameHeaderProps {
  roomCode: string
  phase: GamePhase
  round: number
  playerCount: number
}

const phaseLabels: Record<GamePhase, string> = {
  lobby: 'Lobby',
  assigning: 'Assigning',
  clue: 'Clue Phase',
  discussion: 'Discussion',
  voting: 'Voting',
  reveal: 'Reveal',
  results: 'Results',
}

const phaseColors: Record<GamePhase, string> = {
  lobby: 'text-text-tertiary',
  assigning: 'text-text-tertiary',
  clue: 'text-text-primary',
  discussion: 'text-warning',
  voting: 'text-error',
  reveal: 'text-text-primary',
  results: 'text-success',
}

export function GameHeader({ roomCode, phase, round, playerCount }: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-secondary/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold tracking-[-0.02em] text-text-primary uppercase select-none">
          Echo
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="text-[11px] font-mono tracking-[0.15em] text-text-secondary select-all px-2 py-0.5 rounded-md bg-bg-tertiary/40">
          {roomCode}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePhaseBadge phase={phase} />

        <span className="h-3 w-px bg-border" />

        <span className="text-[11px] font-mono font-medium text-text-tertiary tracking-wide">
          R{round}
        </span>

        <span className="text-[11px] font-medium text-text-tertiary tracking-wide">
          {playerCount}p
        </span>
      </div>
    </header>
  )
}

function AnimatePhaseBadge({ phase }: { phase: GamePhase }) {
  return (
    <motion.span
      key={phase}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.12em]',
        phaseColors[phase]
      )}
    >
      {phaseLabels[phase]}
    </motion.span>
  )
}
