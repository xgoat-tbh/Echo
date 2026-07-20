import { useState, useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

interface TimerProps {
  durationSeconds: number
  running?: boolean
  onExpire?: () => void
  paused?: boolean
}

export function Timer({ durationSeconds, running, onExpire, paused }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const intervalRef = useRef<number | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemaining(durationSeconds)
    expiredRef.current = false
  }, [durationSeconds])

  useEffect(() => {
    if (!running || paused) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          if (!expiredRef.current) {
            expiredRef.current = true
            onExpire?.()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, paused, onExpire])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const pct = durationSeconds > 0 ? remaining / durationSeconds : 0
  const urgent = remaining <= 10

  return (
    <div className="flex items-center gap-3 surface-card px-4 py-2 rounded-full select-none">
      <div className="h-[3px] w-20 rounded-full bg-bg-tertiary/60 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 linear',
            urgent ? 'bg-error/80' : 'bg-text-primary/40'
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span
        className={cn(
          'text-[11px] font-mono font-medium tabular-nums tracking-[0.05em]',
          urgent ? 'text-error/80' : 'text-text-tertiary'
        )}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
