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
            cx="30" cy="30" r={radius} fill="none"
            stroke="currentColor"
            className={cn('transition-all duration-1000 linear', urgent ? 'text-error/80' : 'text-text-primary/40')}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={cn(
          'absolute text-[13px] font-mono font-bold tabular-nums',
          urgent ? 'text-error/80' : 'text-text-primary'
        )}>
          {display}
        </span>
      </div>
    </div>
  )
}
