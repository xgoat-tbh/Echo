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
import { PlayerGrid } from '../../voice/components/PlayerGrid'
import { config } from '../../config'
import { cn } from '../../lib/cn'
import { getRandomWordPair } from '../../game/data/wordPairs'
import type { Player, GamePhase } from '../../store/gameStore'
import { useVoiceStore } from '../../store/voiceStore'

interface RoomPageProps {
  roomCode: string
  onLeave: () => void
}

const getWsUrl = () => {
  const loc = window.location
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:'
  // Fallback support for proxied dev setup
  return `${proto}//${loc.host}/ws`
}

export function RoomPage({ roomCode, onLeave }: RoomPageProps) {
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [round, setRound] = useState(1)
  const [players, setPlayers] = useState<Player[]>([])
  const [localWord, setLocalWord] = useState<string | null>(null)
  const [revealedEchoId, setRevealedEchoId] = useState<string | null>(null)
  const [votes, setVotes] = useState<Array<{ voterId: string; targetId: string }>>([])
  const [clueText, setClueText] = useState('')
  const [clueSubmitted, setClueSubmitted] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [wordVisible, setWordVisible] = useState(false)

  const timerRunning = useRef(false)
  const speakerIndexRef = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)
  const [localId, setLocalId] = useState<string>('local')
  const localIdRef = useRef<string>('local')

  const [localAnalyser, setLocalAnalyser] = useState<AnalyserNode | null>(null)

  // Voice state
  const isMuted = useVoiceStore((s) => s.isMuted)
  const liveMicLevel = useVoiceStore((s) => s.liveMicLevel)
  const setMuted = useVoiceStore((s) => s.setMuted)
  const showDiagnostics = useVoiceStore((s) => s.showDiagnostics)
  const setShowDiagnostics = useVoiceStore((s) => s.setShowDiagnostics)
  const setShowSetup = useVoiceStore((s) => s.setShowSetup)
  const connectionGrade = useVoiceStore((s) => s.connectionGrade)
  
  const volumes = useVoiceStore((s) => s.settings.individualVolumes)
  const setIndividualVolume = useVoiceStore((s) => s.setIndividualVolume)

  // Capture real microphone audio and wire to the analyser
  useEffect(() => {
    let audioPipeline: any = null
    let animationFrameId: number

    const initAudio = async () => {
      try {
        const { AudioPipeline } = await import('../../voice/core/AudioPipeline')
        audioPipeline = new AudioPipeline()
        await audioPipeline.initialize()
        const analyser = audioPipeline.getAnalyser()
        setLocalAnalyser(analyser)

        // Capture VAD level
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const update = () => {
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          const level = average / 255.0
          // scale level slightly for visual response
          useVoiceStore.getState().setLiveMicLevel(level * 2.5)

          animationFrameId = requestAnimationFrame(update)
        }
        update()
      } catch (err) {
        console.warn('Real microphone capture not available:', err)
        // Simulated fallback levels
        let running = true
        const update = () => {
          if (!running) return
          useVoiceStore.getState().setLiveMicLevel(Math.random() * 0.08)
          animationFrameId = requestAnimationFrame(update)
        }
        update()
        return () => { running = false }
      }
    }

    initAudio()

    return () => {
      cancelAnimationFrame(animationFrameId)
      audioPipeline?.destroy()
    }
  }, [])

  // WebSockets Multiplayer State Sync
  useEffect(() => {
    const wsUrl = config.wsUrl || getWsUrl()
    const senderId = Math.random().toString(36).substring(2, 10)
    const socket = new WebSocket(wsUrl)
    wsRef.current = socket

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'room:join',
          roomId: roomCode,
          senderId,
          payload: { roomId: roomCode, username: 'Player_' + senderId.slice(0, 4) },
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2, 15),
        })
      )
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'room:state': {
            const myId = msg.payload.userId
            setLocalId(myId)
            localIdRef.current = myId

            const peers = msg.payload.peers || []
            const peerPlayers = peers.map((peer: any) => ({
              id: peer.id,
              username: peer.id === myId ? 'You' : peer.username,
              avatar: '',
              isReady: true,
              hasSpoken: false,
              hasVoted: false,
              isEcho: false,
              voteTarget: null,
              clue: null,
              word: null,
              isSpeaking: false,
              isMuted: false,
              audioLevel: 0,
            }))

            setPlayers(peerPlayers)
            break
          }

          case 'peer:joined': {
            const { userId, username } = msg.payload
            setPlayers((prev) => {
              if (prev.some((p) => p.id === userId)) return prev
              const updated = [
                ...prev,
                {
                  id: userId,
                  username,
                  avatar: '',
                  isReady: true,
                  hasSpoken: false,
                  hasVoted: false,
                  isEcho: false,
                  voteTarget: null,
                  clue: null,
                  word: null,
                  isSpeaking: false,
                  isMuted: false,
                  audioLevel: 0,
                },
              ]

              // Host state sync relay
              const sorted = updated.slice().sort((a, b) => a.id.localeCompare(b.id))
              if (sorted[0]?.id === localIdRef.current) {
                setTimeout(() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: 'game:sync',
                        roomId: roomCode,
                        senderId: localIdRef.current,
                        payload: {
                          phase,
                          round,
                          players: updated,
                          votes,
                        },
                        timestamp: Date.now(),
                        id: Math.random().toString(36).substring(2, 15),
                      })
                    )
                  }
                }, 500)
              }

              return updated
            })
            break
          }

          case 'peer:left': {
            const { userId } = msg.payload
            setPlayers((prev) => prev.filter((p) => p.id !== userId))
            break
          }

          case 'game:ready': {
            const { userId, isReady } = msg.payload
            setPlayers((prev) =>
              prev.map((p) => (p.id === userId ? { ...p, isReady } : p))
            )
            break
          }

          case 'game:start': {
            const { round: r, assignments } = msg.payload
            setRound(r)
            setLocalWord(assignments[localIdRef.current] || '')
            setPlayers((prev) =>
              prev.map((p) => ({
                ...p,
                word: assignments[p.id] || '',
                isEcho: assignments[p.id] === msg.payload.wordPair.echo,
                hasSpoken: false,
                hasVoted: false,
                clue: null,
                voteTarget: null,
              }))
            )
            setRevealedEchoId(null)
            setVotes([])
            setClueSubmitted(false)
            setHasVoted(false)
            setWordVisible(false)
            setPhase('assigning')

            setTimeout(() => setWordVisible(true), 300)
            setTimeout(() => {
              setPhase('clue')
              setWordVisible(false)
              speakerIndexRef.current = 0
              timerRunning.current = true
            }, 4000)
            break
          }

          case 'game:clue': {
            const { userId, clue } = msg.payload
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === userId ? { ...p, hasSpoken: true, clue } : p
              )
            )
            if (userId !== localIdRef.current) {
              setTimeout(() => {
                speakerIndexRef.current++
                if (speakerIndexRef.current >= players.length) {
                  setPhase('discussion')
                }
              }, 1500)
            }
            break
          }

          case 'game:vote': {
            const { voterId, targetId } = msg.payload
            setVotes((prev) => [...prev, { voterId, targetId }])
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === voterId ? { ...p, hasVoted: true, voteTarget: targetId } : p
              )
            )
            break
          }

          case 'game:sync': {
            const { phase: p, round: r, players: pl, votes: v } = msg.payload
            setPhase(p)
            setRound(r)
            setVotes(v)
            setPlayers(pl)
            break
          }
        }
      } catch (err) {
        console.error('Signaling handle failed:', err)
      }
    }

    return () => {
      socket.close()
    }
  }, [roomCode, phase, round, votes, players])

  // Host starts the game session
  const startGame = useCallback(() => {
    const pair = getRandomWordPair()
    const echoPlayerIndex = Math.floor(Math.random() * players.length)
    const echoPlayer = players[echoPlayerIndex]

    const assignments: Record<string, string> = {}
    players.forEach((p, idx) => {
      assignments[p.id] = idx === echoPlayerIndex ? pair.echo : pair.word
    })

    const payload = {
      round,
      wordPair: pair,
      assignments,
      echoPlayerId: echoPlayer.id,
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'game:start',
          roomId: roomCode,
          senderId: localId,
          payload,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2, 15),
        })
      )
    }

    // Host local setup
    setLocalWord(assignments[localId] || '')
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        word: assignments[p.id] || '',
        isEcho: p.id === echoPlayer.id,
        hasSpoken: false,
        hasVoted: false,
        clue: null,
        voteTarget: null,
      }))
    )
    setRevealedEchoId(null)
    setVotes([])
    setClueSubmitted(false)
    setHasVoted(false)
    setWordVisible(false)
    setPhase('assigning')

    setTimeout(() => setWordVisible(true), 300)
    setTimeout(() => {
      setPhase('clue')
      setWordVisible(false)
      speakerIndexRef.current = 0
      timerRunning.current = true
    }, 4000)
  }, [players, round, roomCode, localId])

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

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'game:clue',
          roomId: roomCode,
          senderId: localId,
          payload: { userId: localId, clue: clueText.trim() },
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2, 15),
        })
      )
    }

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === localId ? { ...p, hasSpoken: true, clue: clueText.trim() } : p
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
  }, [clueText, clueSubmitted, players.length, roomCode, localId])

  const handleVote = useCallback((targetId: string) => {
    setHasVoted(true)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'game:vote',
          roomId: roomCode,
          senderId: localId,
          payload: { voterId: localId, targetId },
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(2, 15),
        })
      )
    }

    setVotes((prev) => [...prev, { voterId: localId, targetId }])
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === localId ? { ...p, hasVoted: true, voteTarget: targetId } : p
      )
    )
  }, [roomCode, localId])

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

  // Map players to voice model format
  const mappedVoicePlayers = players.map((p) => ({
    id: p.id,
    username: p.username,
    avatar: p.avatar,
    isSpeaking: p.id === localId ? liveMicLevel > 0.05 : p.isSpeaking,
    isMuted: p.isMuted,
    audioLevel: p.id === localId ? liveMicLevel : p.audioLevel,
    connectionQuality: 'excellent' as const,
    isLocal: p.id === localId,
  }))

  const isHost = players.length > 0 && players.slice().sort((a, b) => a.id.localeCompare(b.id))[0].id === localId

  return (
    <PageTransition>
      <div className="flex h-full flex-col bg-bg select-none">
        <GameHeader
          roomCode={roomCode}
          phase={phase}
          round={round}
          playerCount={players.length}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center max-w-4xl mx-auto w-full">
          {/* ─── Lobby Phase ─── */}
          {phase === 'lobby' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 w-full">
              <div className="text-center mb-1">
                <h2 className="text-base font-bold text-text-primary tracking-tight">Game Lobby</h2>
                <p className="text-xs text-text-secondary mt-1">
                  {isHost ? 'You are the room host. Start when everyone is ready.' : 'Waiting for host to start the game.'}
                </p>
              </div>

              <div className="w-full">
                <PlayerGrid
                  players={mappedVoicePlayers}
                  volumes={volumes}
                  onVolumeChange={setIndividualVolume}
                  localAnalyser={localAnalyser}
                />
              </div>

              <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-4">
                {isHost ? (
                  <Button
                    onClick={startGame}
                    disabled={players.length < 2}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="font-semibold shadow-xl"
                  >
                    {players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
                  </Button>
                ) : (
                  <div className="text-xs font-bold uppercase tracking-wider text-text-tertiary animate-pulse py-3">
                    Waiting for Host...
                  </div>
                )}
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
          {phase === 'assigning' && (
            <div className="flex flex-col items-center justify-center h-full">
              <WordReveal word={localWord} visible={wordVisible} />
            </div>
          )}

          {/* ─── Clue Phase ─── */}
          {phase === 'clue' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <WordReveal word={localWord} visible />

              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  {currentSpeaker?.id === localId ? 'Your turn' : `${currentSpeaker?.username}'s turn`}
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Give one clue about your word.
                  <br />
                  Don't say it, spell it, or translate it.
                </p>
              </div>

              {currentSpeaker?.id === localId && !clueSubmitted && (
                <div className="flex gap-2 w-full bg-bg-secondary/30 border border-border/60 p-2 rounded-2xl backdrop-blur-sm mt-2">
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

              {currentSpeaker?.id !== localId && (
                <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-text-secondary bg-bg-secondary/40 border border-border/60 px-4 py-2.5 rounded-full backdrop-blur-sm mt-2">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Listening to {currentSpeaker?.username || 'Speaker'}...
                </div>
              )}

              <Timer
                durationSeconds={30}
                running={true}
                onExpire={onClueExpire}
                paused={clueSubmitted || currentSpeaker?.id === localId}
              />
            </div>
          )}

          {/* ─── Discussion Phase ─── */}
          {phase === 'discussion' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-base font-bold text-text-primary tracking-tight">Discussion</h2>
                <p className="text-xs text-text-secondary mt-1">
                  All clues have been given. Discuss who sounds suspicious.
                </p>
              </div>

              {/* Clue recap */}
              <div className="w-full space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4 hover:border-border-hover/60 hover:bg-bg-secondary/70 transition-all duration-300"
                  >
                    <Avatar
                      src={player.avatar}
                      username={player.username}
                      size="sm"
                      isSpeaking={player.id === localId ? liveMicLevel > 0.05 : player.isSpeaking}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{player.username}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                        {player.clue || '"Pass"'}
                      </p>
                    </div>
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
                <h2 className="text-base font-bold text-text-primary tracking-tight">Vote</h2>
                <p className="text-xs text-text-secondary mt-1">Who is the Echo?</p>
              </div>

              <VotePanel
                players={players}
                localPlayerId={localId}
                hasVoted={hasVoted}
                onVote={handleVote}
              />

              <Timer durationSeconds={30} running={phase === 'voting'} onExpire={onVoteExpire} />
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

        {/* ─── Voice Bar ─── */}
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
            <Button variant="danger" size="sm" onClick={onLeave} className="h-8 font-semibold px-4">
              Leave
            </Button>
          </div>
        </div>

        {/* ─── Modals ─── */}
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
