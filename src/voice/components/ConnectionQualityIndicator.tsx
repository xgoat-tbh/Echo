import { cn } from '../../lib/cn'
import type { ConnectionGrade } from '../../store/voiceStore'

interface ConnectionQualityIndicatorProps {
  grade: ConnectionGrade
  ping?: number
  packetLoss?: number
  jitter?: number
  expanded?: boolean
}

const gradeColor: Record<ConnectionGrade, string> = {
  excellent: 'bg-success',
  good: 'bg-success',
  fair: 'bg-warning',
  poor: 'bg-error',
  connecting: 'bg-text-tertiary',
}

const gradeLabel: Record<ConnectionGrade, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  connecting: 'Connecting',
}

export function ConnectionQualityIndicator({
  grade,
  ping,
  packetLoss,
  jitter,
  expanded,
}: ConnectionQualityIndicatorProps) {
  const bars = grade === 'connecting' ? 0 : grade === 'poor' ? 1 : grade === 'fair' ? 2 : grade === 'good' ? 3 : 4

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-[2px] h-3">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              'w-[3px] rounded-sm transition-colors',
              bar <= bars
                ? gradeColor[grade]
                : 'bg-bg-tertiary',
              grade === 'connecting' &&
                bar === 1 &&
                'animate-pulse'
            )}
            style={{ height: `${bar * 5 + 4}px` }}
          />
        ))}
      </div>
      <span className="text-xs text-text-secondary">
        {gradeLabel[grade]}
      </span>
      {expanded && ping !== undefined && (
        <span className="text-xs text-text-tertiary">
          {ping}ms
          {packetLoss !== undefined && packetLoss > 0 && (
            <> · {(packetLoss * 100).toFixed(1)}% loss</>
          )}
          {jitter !== undefined && <> · {jitter}ms jitter</>}
        </span>
      )}
    </div>
  )
}
