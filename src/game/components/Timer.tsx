import { useState, useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

interface TimerProps {
  durationSeconds: number
  running: boolean
  onExpire: () => void
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
            onExpire()
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
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 linear',
            urgent ? 'bg-error' : 'bg-accent'
          )}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-mono tabular-nums',
          urgent ? 'text-error' : 'text-text-secondary'
        )}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
