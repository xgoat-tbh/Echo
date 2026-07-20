import { useState } from 'react'
import { PageTransition } from '../../motion/PageTransition'
import { Button } from '../../design-system/components/Button'
import { cn } from '../../lib/cn'

interface LobbyPageProps {
  onCreateRoom: () => void
  onJoinRoom: (code: string) => void
}

export function LobbyPage({ onCreateRoom, onJoinRoom }: LobbyPageProps) {
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = () => {
    if (!roomCode.trim()) return
    setJoining(true)
    onJoinRoom(roomCode.trim())
  }

  return (
    <PageTransition>
      <div className="flex h-full flex-col items-center justify-center p-6 gap-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-subtle">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Voice Platform
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-sm">
            Real-time voice communication for teams and friends.
            Crystal clear audio, zero setup.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button variant="primary" size="lg" fullWidth onClick={onCreateRoom}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Room
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-text-tertiary">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Room code"
              maxLength={8}
              className={cn(
                'flex-1 h-10 rounded-lg border border-border bg-transparent px-3 text-sm text-text-primary',
                'placeholder:text-text-tertiary',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                'transition-colors'
              )}
            />
            <Button
              variant="secondary"
              size="md"
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              loading={joining}
            >
              Join
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-text-tertiary text-center max-w-xs">
          Your microphone will be requested when you join a room.
          No account required.
        </p>
      </div>
    </PageTransition>
  )
}
