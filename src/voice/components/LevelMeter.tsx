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
  height = 12,
  orientation = 'horizontal',
  showLabel = false,
  numSegments = 14,
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
      ? (width - (numSegments - 1) * 2) / numSegments
      : (height - (numSegments - 1) * 2) / numSegments
    const gap = 2

    ctx.strokeStyle = 'transparent'

    for (let i = 0; i < numSegments; i++) {
      const segIndex = i / numSegments
      const isActive = segIndex <= displayLevel
      const isPeak = peak && segIndex <= peakRef.current

      let color: string
      if (isPeak) {
        color = 'hsl(0, 0%, 98%)'
      } else if (isActive) {
        if (i < numSegments * 0.7) {
          color = 'hsl(240, 5%, 85%)'
        } else if (i < numSegments * 0.9) {
          color = 'hsl(47, 95%, 45%)'
        } else {
          color = 'hsl(358, 75%, 50%)'
        }
      } else {
        color = 'hsla(240, 5%, 80%, 0.08)'
      }

      ctx.fillStyle = color

      if (isHorizontal) {
        const x = i * (segSize + gap)
        ctx.fillRect(x, 0, segSize, height)
      } else {
        const y = height - (i + 1) * (segSize + gap)
        ctx.fillRect(0, y, width, segSize)
      }
    }
  }, [displayLevel, peak, width, height, orientation, numSegments])

  return (
    <div className={cn('flex items-center gap-2.5', orientation === 'vertical' && 'flex-col')}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-sm"
        style={{ width, height }}
      />
      {showLabel && (
        <span className="text-[10px] font-mono text-text-secondary tabular-nums min-w-[3.5rem] text-right font-semibold">
          {dBFS === -Infinity ? '-∞' : `${dBFS}`} dB
        </span>
      )}
    </div>
  )
}
