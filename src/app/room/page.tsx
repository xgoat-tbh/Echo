import { useEffect, useCallback } from 'react'
import { PageTransition } from '../../motion/PageTransition'
import { PlayerGrid } from '../../voice/components/PlayerGrid'
import { VoiceControlBar } from '../../voice/components/VoiceControlBar'
import { VoiceSetupOverlay } from '../../voice/components/VoiceSetupOverlay'
import { VoiceDiagnosticsPanel } from '../../voice/components/VoiceDiagnosticsPanel'
import { useVoiceStore, type Player } from '../../store/voiceStore'
import { cn } from '../../lib/cn'

interface RoomPageProps {
  roomCode: string
  onLeave: () => void
}

const MOCK_PLAYERS: Player[] = [
  { id: 'local', username: 'You', avatar: '', isSpeaking: false, isMuted: false, audioLevel: 0, connectionQuality: 'excellent', isLocal: true },
  { id: 'p1', username: 'Alex', avatar: '', isSpeaking: false, isMuted: false, audioLevel: 0, connectionQuality: 'good', isLocal: false },
  { id: 'p2', username: 'Jordan', avatar: '', isSpeaking: true, isMuted: false, audioLevel: 0.7, connectionQuality: 'excellent', isLocal: false },
  { id: 'p3', username: 'Sam', avatar: '', isSpeaking: false, isMuted: true, audioLevel: 0, connectionQuality: 'fair', isLocal: false },
  { id: 'p4', username: 'Riley', avatar: '', isSpeaking: false, isMuted: false, audioLevel: 0, connectionQuality: 'good', isLocal: false },
  { id: 'p5', username: 'Morgan', avatar: '', isSpeaking: false, isMuted: false, audioLevel: 0, connectionQuality: 'connecting', isLocal: false },
]

export function RoomPage({ roomCode, onLeave }: RoomPageProps) {
  const players = useVoiceStore((s) => s.players)
  const settings = useVoiceStore((s) => s.settings)
  const isInVoice = useVoiceStore((s) => s.isInVoice)
  const isMuted = useVoiceStore((s) => s.isMuted)
  const isPTTActive = useVoiceStore((s) => s.isPTTActive)
  const liveMicLevel = useVoiceStore((s) => s.liveMicLevel)
  const connectionGrade = useVoiceStore((s) => s.connectionGrade)
  const showDiagnostics = useVoiceStore((s) => s.showDiagnostics)
  const diagnostics = useVoiceStore((s) => s.diagnostics)

  const setMuted = useVoiceStore((s) => s.setMuted)
  const setPTTActive = useVoiceStore((s) => s.setPTTActive)
  const setPlayers = useVoiceStore((s) => s.setPlayers)
  const setInVoice = useVoiceStore((s) => s.setInVoice)
  const setShowSetup = useVoiceStore((s) => s.setShowSetup)
  const setShowDiagnostics = useVoiceStore((s) => s.setShowDiagnostics)
  const setIndividualVolume = useVoiceStore((s) => s.setIndividualVolume)

  // Mock: load players and connect
  useEffect(() => {
    setPlayers(MOCK_PLAYERS)
    setInVoice(true)

    // Simulate speaking toggle on p2
    const interval = setInterval(() => {
      const p2 = MOCK_PLAYERS[2]
      p2.isSpeaking = !p2.isSpeaking
      setPlayers([...MOCK_PLAYERS])
    }, 3000)

    return () => {
      clearInterval(interval)
      setInVoice(false)
    }
  }, [setPlayers, setInVoice])

  // PTT keyboard handling
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (settings.pushToTalk && e.code === settings.pushToTalkKey) {
        setPTTActive(true)
      }
    },
    [settings.pushToTalk, settings.pushToTalkKey, setPTTActive]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (settings.pushToTalk && e.code === settings.pushToTalkKey) {
        setPTTActive(false)
      }
    },
    [settings.pushToTalk, settings.pushToTalkKey, setPTTActive]
  )

  useEffect(() => {
    if (settings.pushToTalk) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [settings.pushToTalk, handleKeyDown, handleKeyUp])

  // Simulate mic level
  useEffect(() => {
    let running = true
    const updateLevel = () => {
      if (!running) return
      useVoiceStore.getState().setLiveMicLevel(Math.random() * 0.3)
      requestAnimationFrame(updateLevel)
    }
    updateLevel()
    return () => { running = false }
  }, [])

  const handleLeave = useCallback(() => {
    setInVoice(false)
    onLeave()
  }, [setInVoice, onLeave])

  return (
    <PageTransition>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm font-medium text-text-primary">
              {roomCode}
            </span>
          </div>
          <span className="text-xs text-text-secondary">
            {players.length} participant{players.length !== 1 ? 's' : ''}
          </span>
        </header>

        {/* Player Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {!isInVoice ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="h-12 w-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-tertiary"
                >
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">
                Not connected to voice
              </p>
              <button
                onClick={() => setShowSetup(true)}
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Connect microphone
              </button>
            </div>
          ) : (
            <PlayerGrid
              players={players}
              volumes={settings.individualVolumes}
              onVolumeChange={setIndividualVolume}
              localAnalyser={null}
            />
          )}
        </main>

        {/* Voice Control Bar */}
        <VoiceControlBar
          isMuted={isMuted}
          isPTTActive={isPTTActive}
          liveLevel={liveMicLevel}
          connectionGrade={connectionGrade}
          onToggleMute={() => setMuted(!isMuted)}
          onTogglePTT={() => {}}
          onOpenSettings={() => setShowSetup(true)}
          onOpenDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
          onLeave={handleLeave}
        />
      </div>

      {/* Overlays */}
      <VoiceSetupOverlay />
      <VoiceDiagnosticsPanel
        open={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        diagnostics={diagnostics}
      />
    </PageTransition>
  )
}
