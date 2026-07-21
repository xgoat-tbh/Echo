import { cn } from '../../lib/cn'

interface TimerProps {
  value: number
  max: number
}

export function Timer({ value, max }: TimerProps) {
  const pct = max > 0 ? value / max : 0
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  const urgent = value <= 10

  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct)

  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <div className="flex items-center justify-center select-none">
      <div className="relative flex items-center justify-center">
        <svg width="60" height="60" viewBox="0 0 60 60" className="transform -rotate-90">
          <circle cx="30" cy="30" r={radius} fill="none" stroke="currentColor" className="text-bg-tertiary/40" strokeWidth="3" />
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="currentColor"
            className={cn(
              'transition-all duration-1000 linear',
              urgent ? 'text-tension' : 'text-accent'
            )}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span
          className={cn(
            'absolute text-[13px] font-mono font-semibold tabular-nums tracking-wide',
            urgent ? 'text-tension animate-pulse' : 'text-text-primary'
          )}
        >
          {display}
        </span>
      </div>
    </div>
  )
}
