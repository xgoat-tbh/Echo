import { useRef, useEffect } from 'react'
import { cn } from '../../lib/cn'

interface LevelMeterProps {
  level: number
  peak?: number
  width?: number
  height?: number
  orientation?: 'horizontal' | 'vertical'
  showLabel?: boolean
  numSegments?: number
}

export function LevelMeter({
  level,
  peak,
  width = 120,
  height = 20,
  orientation = 'horizontal',
  showLabel = false,
  numSegments = 12,
}: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const peakRef = useRef(0)
  const peakTimerRef = useRef<number | null>(null)

  const dBFS = level > 0 ? Math.round(20 * Math.log10(level)) : -Infinity
  const displayLevel = Math.min(1, Math.max(0, level))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // Update peak (hold for 1s)
    if (displayLevel > peakRef.current) {
      peakRef.current = displayLevel
    }
    if (peakTimerRef.current !== null) {
      clearTimeout(peakTimerRef.current)
    }
    peakTimerRef.current = window.setTimeout(() => {
      peakRef.current = 0
    }, 1000)

    const isHorizontal = orientation === 'horizontal'
    const segSize = isHorizontal
      ? (width - 2) / numSegments
      : (height - 2) / numSegments
    const gap = 2

    ctx.strokeStyle = 'transparent'

    for (let i = 0; i < numSegments; i++) {
      const segIndex = i / numSegments
      const isActive = segIndex <= displayLevel
      const isPeak = peak && segIndex <= peakRef.current

      let color: string
      if (isPeak) {
        color = 'hsl(220, 70%, 55%)'
      } else if (isActive) {
        if (i < numSegments * 0.7) {
          color = 'hsl(220, 60%, 50%)'
        } else if (i < numSegments * 0.9) {
          color = 'hsl(45, 90%, 50%)'
        } else {
          color = 'hsl(0, 80%, 55%)'
        }
      } else {
        color = 'hsla(220, 8%, 30%, 0.4)'
      }

      ctx.fillStyle = color

      if (isHorizontal) {
        const x = 1 + i * (segSize + gap)
        ctx.fillRect(x, 1, segSize, height - 2)
      } else {
        const y = height - 1 - (i + 1) * (segSize + gap)
        ctx.fillRect(1, y, width - 2, segSize)
      }
    }

    // Rounded corners on segments
    const segments = canvas.querySelectorAll('rect')
    segments.forEach((seg) => {
      ;(seg as any).style.borderRadius = '2px'
    })
  }, [displayLevel, peak, width, height, orientation, numSegments])

  return (
    <div className={cn('flex items-center gap-2', orientation === 'vertical' && 'flex-col')}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-sm"
        style={{ width, height }}
      />
      {showLabel && (
        <span className="text-xs text-text-secondary tabular-nums min-w-[4rem]">
          {dBFS === -Infinity ? '-∞' : `${dBFS}`} dBFS
        </span>
      )}
    </div>
  )
}
