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
  assigning: 'Assigning Words',
  clue: 'Clue Phase',
  discussion: 'Discussion',
  voting: 'Voting',
  reveal: 'Reveal',
  results: 'Results',
}

const phaseColors: Record<GamePhase, string> = {
  lobby: 'bg-bg-tertiary border-border text-text-secondary',
  assigning: 'bg-bg-tertiary border-border text-text-secondary',
  clue: 'bg-accent-subtle border-text-primary/10 text-text-primary',
  discussion: 'bg-warning/10 border-warning/20 text-warning',
  voting: 'bg-error/10 border-error/20 text-error',
  reveal: 'bg-accent-subtle border-text-primary/10 text-text-primary',
  results: 'bg-success/10 border-success/20 text-success',
}

export function GameHeader({ roomCode, phase, round, playerCount }: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-bg-secondary/20 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-sm font-black tracking-tight text-text-primary uppercase select-none">
          Echo
        </span>
        <span className="h-3.5 w-px bg-border/60" />
        <span className="text-[11px] font-mono tracking-widest text-text-secondary uppercase select-all bg-bg-secondary px-2.5 py-1 rounded-lg border border-border/40">
          {roomCode}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePhaseBadge phase={phase} />

        <span className="h-3.5 w-px bg-border/60" />

        <span className="text-xs font-semibold font-mono text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-md border border-border/40">
          R{round}
        </span>

        <span className="text-xs font-semibold text-text-secondary">
          {playerCount} {playerCount === 1 ? 'Player' : 'Players'}
        </span>
      </div>
    </header>
  )
}

function AnimatePhaseBadge({ phase }: { phase: GamePhase }) {
  return (
    <motion.span
      key={phase}
      initial={{ opacity: 0, y: -4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all duration-200',
        phaseColors[phase]
      )}
    >
      {phaseLabels[phase]}
    </motion.span>
  )
}
