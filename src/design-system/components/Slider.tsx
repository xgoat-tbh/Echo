import { useCallback, useRef } from 'react'
import { cn } from '../../lib/cn'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
  icon?: React.ReactNode
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue,
  icon,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = ((value - min) / (max - min)) * 100

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const val = Math.round((min + ratio * (max - min)) / step) * step
      onChange(Math.max(min, Math.min(max, val)))
    },
    [min, max, step, onChange]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      handlePointer(e.clientX)
      const onMove = (e: PointerEvent) => handlePointer(e.clientX)
      const onUp = () => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [handlePointer]
  )

  return (
    <div className="group flex items-center gap-3 w-full">
      {icon && (
        <span className="shrink-0 text-text-secondary group-hover:text-text-primary transition-colors">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
              {label}
            </span>
            {showValue && (
              <span className="text-[11px] font-mono text-text-tertiary group-hover:text-text-secondary transition-colors tabular-nums">
                {value}
              </span>
            )}
          </div>
        )}
        <div
          ref={trackRef}
          className="relative h-[4px] cursor-pointer rounded-full bg-bg-tertiary/60 transition-colors"
          onPointerDown={handlePointerDown}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-text-primary pointer-events-none"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-[12px] w-[12px] rounded-full bg-text-primary border border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.6)] pointer-events-none transition-transform duration-100 ease-out scale-100 group-hover:scale-[1.2] active:scale-[1.0]"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
