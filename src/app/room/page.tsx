import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '../../motion/PageTransition'
import { GameHeader } from '../../game/components/GameHeader'
import { WordReveal } from '../../game/components/WordReveal'
import { VotePanel } from '../../game/components/VotePanel'
import { ResultsScreen } from '../../game/components/ResultsScreen'
import { Timer } from '../../game/components/Timer'
import { Avatar } from '../../design-system/components/Avatar'
import { Button } from '../../design-system/components/Button'
import { VoiceSetupOverlay } from '../../voice/components/VoiceSetupOverlay'
import { VoiceDiagnosticsPanel } from '../../voice/components/VoiceDiagnosticsPanel'
import { cn } from '../../lib/cn'
import { getRandomWordPair } from '../../game/data/wordPairs'
import type { Player, GamePhase } from '../../store/gameStore'
import { useVoiceStore } from '../../store/voiceStore'

interface RoomPageProps {
  roomCode: string
  onLeave: () => void
}

const MOCK_PLAYERS: Player[] = [
  { id: 'local', username: 'You', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
  { id: 'p1', username: 'Alex', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
  { id: 'p2', username: 'Jordan', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
  { id: 'p3', username: 'Sam', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
  { id: 'p4', username: 'Riley', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
  { id: 'p5', username: 'Morgan', avatar: '', isReady: true, hasSpoken: false, hasVoted: false, isEcho: false, voteTarget: null, clue: null, word: null, isSpeaking: false, isMuted: false, audioLevel: 0 },
]

export function RoomPage({ roomCode, onLeave }: RoomPageProps) {
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [round, setRound] = useState(1)
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS)
  const [localWord, setLocalWord] = useState<string | null>(null)
  const [revealedEchoId, setRevealedEchoId] = useState<string | null>(null)
  const [votes, setVotes] = useState<Array<{ voterId: string; targetId: string }>>([])
  const [clueText, setClueText] = useState('')
  const [clueSubmitted, setClueSubmitted] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [wordVisible, setWordVisible] = useState(false)

  const timerRunning = useRef(false)
  const speakerIndexRef = useRef(0)

  const localPlayer = players.find((p) => p.id === 'local')
  const otherPlayers = players.filter((p) => p.id !== 'local')

  // Voice state
  const isMuted = useVoiceStore((s) => s.isMuted)
  const liveMicLevel = useVoiceStore((s) => s.liveMicLevel)
  const setMuted = useVoiceStore((s) => s.setMuted)
  const showDiagnostics = useVoiceStore((s) => s.showDiagnostics)
  const setShowDiagnostics = useVoiceStore((s) => s.setShowDiagnostics)
  const setShowSetup = useVoiceStore((s) => s.setShowSetup)
  const connectionGrade = useVoiceStore((s) => s.connectionGrade)

  // Simulate mic level
  useEffect(() => {
    let running = true
    const update = () => {
      if (!running) return
      useVoiceStore.getState().setLiveMicLevel(Math.random() * 0.3)
      requestAnimationFrame(update)
    }
    update()
    return () => { running = false }
  }, [])

  // Start game
  const startGame = useCallback(() => {
    const pair = getRandomWordPair()
    const echoIndex = Math.floor(Math.random() * MOCK_PLAYERS.length)
    const updatedPlayers = MOCK_PLAYERS.map((p, i) => ({
      ...p,
      word: i === echoIndex ? pair.echo : pair.word,
      isEcho: i === echoIndex,
      hasSpoken: false,
      hasVoted: false,
      clue: null,
      voteTarget: null,
    }))
    setPlayers(updatedPlayers)
    setLocalWord(updatedPlayers[0].word)
    setRevealedEchoId(null)
    setVotes([])
    setClueSubmitted(false)
    setHasVoted(false)
    setWordVisible(false)
    setPhase('assigning')

    // Show word, then transition to clue
    setTimeout(() => setWordVisible(true), 300)
    setTimeout(() => {
      setPhase('clue')
      setWordVisible(false)
      speakerIndexRef.current = 0
      timerRunning.current = true
    }, 4000)
  }, [])

  // Phase transitions
  useEffect(() => {
    if (phase !== 'clue') return
    const currentSpeaker = players[speakerIndexRef.current]
    if (!currentSpeaker) {
      setPhase('discussion')
      return
    }
  }, [phase, players])

  const onClueExpire = useCallback(() => {
    speakerIndexRef.current++
    if (speakerIndexRef.current >= players.length) {
      setPhase('discussion')
    } else {
      setClueSubmitted(false)
      setClueText('')
    }
  }, [players.length])

  const onDiscussionExpire = useCallback(() => {
    setPhase('voting')
  }, [])

  const onVoteExpire = useCallback(() => {
    revealResults()
  }, [])

  const submitClue = useCallback(() => {
    if (!clueText.trim() || clueSubmitted) return
    setClueSubmitted(true)
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 'local' ? { ...p, hasSpoken: true, clue: clueText.trim() } : p
      )
    )
    setTimeout(() => {
      speakerIndexRef.current++
      if (speakerIndexRef.current >= players.length) {
        setPhase('discussion')
      } else {
        setClueSubmitted(false)
        setClueText('')
      }
    }, 1500)
  }, [clueText, clueSubmitted, players.length])

  const handleVote = useCallback((targetId: string) => {
    setHasVoted(true)
    setVotes((prev) => [...prev, { voterId: 'local', targetId }])
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === 'local' ? { ...p, hasVoted: true, voteTarget: targetId } : p
      )
    )
  }, [])

  const revealResults = useCallback(() => {
    const counts = new Map<string, number>()
    votes.forEach((v) => counts.set(v.targetId, (counts.get(v.targetId) || 0) + 1))
    let maxVotes = 0
    let mostVoted: string | null = null
    counts.forEach((count, id) => {
      if (count > maxVotes) {
        maxVotes = count
        mostVoted = id
      }
    })
    setRevealedEchoId(mostVoted)
    setPhase('reveal')
    setTimeout(() => setPhase('results'), 2000)
  }, [votes])

  const currentSpeaker = players[speakerIndexRef.current]

  return (
    <PageTransition>
      <div className="flex h-full flex-col bg-bg">
        <GameHeader
          roomCode={roomCode}
          phase={phase}
          round={round}
          playerCount={players.length}
        />

        <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-center">
          {/* ─── Lobby Phase ─── */}
          {phase === 'lobby' && (
            <div className="flex flex-col items-center justify-center h-full gap-8 max-w-xl mx-auto">
              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-text-primary tracking-tight">Game Lobby</h2>
                <p className="text-xs text-text-secondary mt-1">Waiting for players to get ready</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col items-center justify-center border border-border bg-bg-secondary/40 rounded-2xl p-4 gap-2.5 text-center transition-all hover:bg-bg-secondary/70 hover:border-border-hover/60"
                  >
                    <Avatar
                      src={player.avatar}
                      username={player.username}
                      size="md"
                      status={player.isReady ? 'online' : 'idle'}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0 w-full">
                      <span className={cn(
                        'text-xs font-semibold truncate',
                        player.id === 'local' ? 'text-text-primary font-bold' : 'text-text-secondary'
                      )}>
                        {player.username}
                      </span>
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider',
                        player.isReady ? 'text-success/80' : 'text-text-tertiary'
                      )}>
                        {player.isReady ? 'Ready' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-4">
                <Button
                  onClick={startGame}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="font-semibold shadow-xl"
                >
                  Start Game
                </Button>
                <button
                  onClick={onLeave}
                  className="text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Leave room
                </button>
              </div>
            </div>
          )}

          {/* ─── Word Assignment ─── */}
          {(phase === 'assigning') && (
            <div className="flex flex-col items-center justify-center h-full">
              <WordReveal word={localWord} visible={wordVisible} />
            </div>
          )}

          {/* ─── Clue Phase ─── */}
          {phase === 'clue' && (
            <div className="flex flex-col items-center max-w-md mx-auto gap-8 pt-4 w-full">
              <WordReveal word={localWord} visible />

              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  {currentSpeaker?.id === 'local' ? 'Your turn' : `${currentSpeaker?.username}'s turn`}
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Give one clue about your word.
                  <br />
                  Don't say it, spell it, or translate it.
                </p>
              </div>

              {currentSpeaker?.id === 'local' && !clueSubmitted && (
                <div className="flex gap-2 w-full bg-bg-secondary/30 border border-border/60 p-2 rounded-2xl backdrop-blur-sm">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitClue()}
                    placeholder="Type your clue..."
                    maxLength={100}
                    className="flex-1 h-[48px] rounded-xl border border-border bg-bg-tertiary/40 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-hover/20 focus:border-text-primary/40 focus:bg-bg-tertiary/60 transition-all duration-300"
                    autoFocus
                  />
                  <Button
                    onClick={submitClue}
                    disabled={!clueText.trim()}
                    variant="primary"
                    size="lg"
                    className="font-semibold px-6"
                  >
                    Submit
                  </Button>
                </div>
              )}

              {currentSpeaker?.id !== 'local' && (
                <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-text-secondary bg-bg-secondary/40 border border-border/60 px-4 py-2.5 rounded-full backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Listening to {currentSpeaker?.username}...
                </div>
              )}

              <Timer
                durationSeconds={30}
                running={true}
                onExpire={onClueExpire}
                paused={clueSubmitted || currentSpeaker?.id === 'local'}
              />
            </div>
          )}

          {/* ─── Discussion Phase ─── */}
          {phase === 'discussion' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Discussion
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  All clues have been given. Discuss who sounds suspicious.
                </p>
              </div>

              {/* Clue recap */}
              <div className="w-full space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4 hover:border-border-hover/60 hover:bg-bg-secondary/70 transition-all duration-300"
                  >
                    <Avatar
                      src={player.avatar}
                      username={player.username}
                      size="sm"
                      isSpeaking={
                        player.id !== 'local' &&
                        Math.random() > 0.7
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">
                          {player.username}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                        {player.clue || '"Pass"'}
                      </p>
                    </div>
                    {player.isSpeaking && (
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              <Timer
                durationSeconds={120}
                running={phase === 'discussion'}
                onExpire={onDiscussionExpire}
              />
            </div>
          )}

          {/* ─── Voting Phase ─── */}
          {phase === 'voting' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Vote
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Who is the Echo?
                </p>
              </div>

              <VotePanel
                players={players}
                localPlayerId="local"
                hasVoted={hasVoted}
                onVote={handleVote}
              />

              <Timer
                durationSeconds={30}
                running={phase === 'voting'}
                onExpire={onVoteExpire}
              />
            </div>
          )}

          {/* ─── Reveal + Results ─── */}
          {phase === 'reveal' && (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <p className="text-sm font-semibold tracking-wide text-text-secondary mb-4 uppercase">
                  The votes are in...
                </p>
              </motion.div>
            </div>
          )}

          {phase === 'results' && (
            <ResultsScreen
              players={players}
              revealedEchoId={revealedEchoId}
              votes={votes}
              onPlayAgain={() => {
                setRound((r) => r + 1)
                startGame()
              }}
              onLeave={onLeave}
            />
          )}
        </main>

        {/* ─── Voice Bar (subtle, embedded glassmorphism) ─── */}
        <div className="flex items-center gap-4 px-6 py-4 border-t border-border bg-bg-secondary/70 backdrop-blur-md">
          <Button
            variant={isMuted ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setMuted(!isMuted)}
            className="h-8 gap-2"
          >
            {isMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
            <span className="hidden sm:inline font-semibold">{isMuted ? 'Muted' : 'Mic'}</span>
          </Button>

          {/* Level meter */}
          <div className="h-[4px] w-20 rounded-full bg-bg-tertiary overflow-hidden hidden sm:block">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(100, liveMicLevel * 100)}%`,
                background: isMuted ? 'var(--color-error)' : 'var(--color-text-primary)',
              }}
            />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary hidden sm:block">
            {connectionGrade === 'excellent' ? 'Voice: Good' : 'Voice: Fair'}
          </span>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSetup(true)}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!useVoiceStore.getState().diagnostics) {
                  useVoiceStore.getState().setDiagnostics({
                    rtt: 24,
                    jitter: 2,
                    packetLoss: 0.001,
                    bitrate: 48000,
                    codec: 'Opus (48kHz)',
                    fecActive: true,
                    iceType: 'STUN (srflx)',
                    localIp: '192.168.1.15',
                    inputLevel: -42.5,
                    noiseLevel: -78.2,
                    inputSampleRate: 48000,
                    inputDeviceName: 'Default Input Device',
                    outputDeviceName: 'Default Output Device',
                    outputLatency: 12,
                  })
                }
                setShowDiagnostics(true)
              }}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Diagnostics
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onLeave}
              className="h-8 font-semibold px-4"
            >
              Leave
            </Button>
          </div>
        </div>

        {/* ─── Modals Setup and Diagnostics ─── */}
        <VoiceSetupOverlay />
        <VoiceDiagnosticsPanel
          open={showDiagnostics}
          onClose={() => setShowDiagnostics(false)}
          diagnostics={useVoiceStore((s) => s.diagnostics)}
        />
      </div>
    </PageTransition>
  )
}
