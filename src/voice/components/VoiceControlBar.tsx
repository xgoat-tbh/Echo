import { cn } from '../../lib/cn'
import { Button } from '../../design-system/components/Button'

interface VoiceControlBarProps {
  isMuted: boolean
  isPTTActive: boolean
  liveLevel: number
  connectionGrade: string
  onToggleMute: () => void
  onTogglePTT: () => void
  onOpenSettings: () => void
  onOpenDiagnostics: () => void
  onLeave: () => void
}

export function VoiceControlBar({
  isMuted,
  isPTTActive,
  liveLevel,
  connectionGrade,
  onToggleMute,
  onTogglePTT,
  onOpenSettings,
  onOpenDiagnostics,
  onLeave,
}: VoiceControlBarProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 flex items-center gap-2 px-4 py-3',
        'border-t border-border bg-bg/80 backdrop-blur-lg',
        'safe-area-bottom:pb-[calc(0.75rem+var(--safe-bottom))]'
      )}
    >
      {/* Mute button */}
      <Button
        variant={isMuted ? 'danger' : 'secondary'}
        size="sm"
        onClick={onToggleMute}
        className="gap-2"
      >
        {isMuted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
        <span className="hidden sm:inline">
          {isMuted ? 'Unmute' : 'Mute'}
        </span>
      </Button>

      {/* PTT indicator */}
      {isPTTActive && !isMuted && (
        <span className="text-[10px] uppercase tracking-wide text-accent font-medium">
          PTT
        </span>
      )}

      {/* Live level meter */}
      <div className="hidden sm:flex items-center gap-1.5 flex-1 max-w-[160px]">
        <div className="h-2 flex-1 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${Math.min(100, liveLevel * 100)}%`,
              background: isMuted
                ? 'hsl(0, 60%, 40%)'
                : 'linear-gradient(90deg, hsl(220, 60%, 50%), hsl(220, 70%, 60%))',
            }}
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Connection quality */}
      <span
        className={cn(
          'hidden md:inline text-xs text-text-secondary',
          connectionGrade === 'poor' && 'text-error'
        )}
      >
        {connectionGrade === 'excellent' && 'Excellent'}
        {connectionGrade === 'good' && 'Good'}
        {connectionGrade === 'fair' && 'Fair'}
        {connectionGrade === 'poor' && 'Poor'}
        {connectionGrade === 'connecting' && 'Connecting...'}
      </span>

      {/* Settings */}
      <Button variant="ghost" size="sm" onClick={onOpenSettings}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </Button>

      {/* Diagnostics */}
      <Button variant="ghost" size="sm" onClick={onOpenDiagnostics}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
      </Button>

      {/* Leave */}
      <Button variant="danger" size="sm" onClick={onLeave}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span className="hidden sm:inline">Leave</span>
      </Button>
    </div>
  )
}
