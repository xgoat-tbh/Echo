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
  lobby: 'text-text-secondary',
  assigning: 'text-text-secondary',
  clue: 'text-accent',
  discussion: 'text-warning',
  voting: 'text-error',
  reveal: 'text-accent',
  results: 'text-success',
}

export function GameHeader({ roomCode, phase, round, playerCount }: GameHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          Echo
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="text-xs font-mono tracking-wider text-text-secondary">
          {roomCode}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <motion.span
          key={phase}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-xs font-medium', phaseColors[phase])}
        >
          {phaseLabels[phase]}
        </motion.span>

        <span className="text-xs text-text-tertiary">
          R{round}
        </span>

        <span className="text-xs text-text-tertiary">
          {playerCount} player{playerCount !== 1 ? 's' : ''}
        </span>
      </div>
    </header>
  )
}
