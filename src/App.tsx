import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Crown, Mic, MicOff, Play, ArrowLeft } from 'lucide-react'
import { useSocket, type Player } from './hooks/useSocket'
import { PageTransition } from './motion/PageTransition'
import { GameHeader } from './game/components/GameHeader'
import { WordReveal } from './game/components/WordReveal'
import { VotePanel } from './game/components/VotePanel'
import { ResultsScreen } from './game/components/ResultsScreen'
import { Timer } from './game/components/Timer'
import { cn } from './lib/cn'
import { config } from './config'

export default function App() {
  const { roomState, error, isConnected, voiceOffer, voiceAnswer, iceCandidate, actions, socket } = useSocket()

  const [nickname, setNickname] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [clueText, setClueText] = useState('')

  // Voice P2P
  const [isMuted, setIsMuted] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({})

  const getSelfPlayer = (): Player | undefined => {
    if (!roomState || !socket?.id) return undefined
    return roomState.players.find(p => p.id === socket.id)
  }

  const self = getSelfPlayer()
  const isHost = self?.isHost || false

  const handleCopyCode = () => {
    if (!roomState) return
    navigator.clipboard.writeText(roomState.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── P2P Voice ───
  const initLocalAudio = async () => {
    try {
      if (localStreamRef.current) return
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      localStreamRef.current = stream
      stream.getAudioTracks().forEach(track => { track.enabled = !isMuted })
      connectToPeers()
    } catch { }
  }

  useEffect(() => {
    if (roomState) initLocalAudio()
  }, [roomState?.code])

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      Object.keys(peersRef.current).forEach(id => closePeerConnection(id))
    }
  }, [])

  const closePeerConnection = (playerId: string) => {
    peersRef.current[playerId]?.close()
    delete peersRef.current[playerId]
    if (audioElementsRef.current[playerId]) {
      audioElementsRef.current[playerId].srcObject = null
      delete audioElementsRef.current[playerId]
    }
  }

  const createPeerConnection = (targetId: string, isInitiator: boolean) => {
    if (peersRef.current[targetId]) return peersRef.current[targetId]
    const pc = new RTCPeerConnection({
      iceServers: config.iceServers as RTCIceServer[],
    })
    peersRef.current[targetId] = pc

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) actions.relayIceCandidate(targetId, event.candidate)
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (!audioElementsRef.current[targetId]) {
        const audio = new Audio()
        audio.srcObject = remoteStream
        audio.autoplay = true
        audioElementsRef.current[targetId] = audio
      }
    }

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => actions.relayVoiceOffer(targetId, pc.localDescription))
        .catch(() => { })
    }

    return pc
  }

  const connectToPeers = () => {
    const myId = socket?.id
    if (!roomState || !myId) return
    roomState.players.forEach(p => {
      if (p.id !== myId) {
        const isInitiator = myId < p.id
        if (!peersRef.current[p.id]) createPeerConnection(p.id, isInitiator)
      }
    })
  }

  useEffect(() => {
    if (roomState && socket?.id) {
      connectToPeers()
      Object.keys(peersRef.current).forEach(id => {
        if (!roomState.players.some(p => p.id === id)) closePeerConnection(id)
      })
    }
  }, [roomState?.players.map(p => p.id).join(',')])

  useEffect(() => {
    if (voiceOffer && socket?.id) {
      const { senderId, offer } = voiceOffer
      let pc = peersRef.current[senderId]
      if (!pc) pc = createPeerConnection(senderId, false)
      pc.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => pc.createAnswer())
        .then(answer => pc.setLocalDescription(answer))
        .then(() => actions.relayVoiceAnswer(senderId, pc.localDescription))
        .catch(() => { })
    }
  }, [voiceOffer])

  useEffect(() => {
    if (voiceAnswer) {
      const { senderId, answer } = voiceAnswer
      peersRef.current[senderId]?.setRemoteDescription(new RTCSessionDescription(answer)).catch(() => { })
    }
  }, [voiceAnswer])

  useEffect(() => {
    if (iceCandidate) {
      const { senderId, candidate } = iceCandidate
      peersRef.current[senderId]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { })
    }
  }, [iceCandidate])

  const toggleLocalMute = () => {
    const next = !isMuted
    setIsMuted(next)
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next })
    actions.toggleMute(next)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    actions.createRoom(nickname.trim())
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !roomCodeInput.trim()) return
    actions.joinRoom(roomCodeInput.trim().toUpperCase(), nickname.trim())
  }

  // ─── RENDER: No room → Landing ───
  if (!roomState) {
    return (
      <PageTransition>
        <div className="flex h-full flex-col overflow-y-auto bg-bg">
          <main className="flex-1 flex flex-col items-center px-6 justify-center max-w-3xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center pt-20 pb-10 max-w-xl"
            >
              <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-text-primary select-none uppercase">Echo</h1>
              <p className="mt-4 text-base sm:text-[17px] text-text-secondary max-w-sm leading-relaxed">
                One room. One different word.<br />Can you find the Echo?
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-md bg-bg-secondary/30 border border-border/60 p-2 rounded-2xl backdrop-blur-sm">
                {!isJoining ? (
                  <form onSubmit={handleCreate} className="w-full space-y-4 p-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter your name..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                      className="w-full px-4 py-3 bg-bg-tertiary/40 border border-border/80 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-hover/20 focus:border-text-primary/40 transition-all duration-300"
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={!nickname.trim()}
                        className="flex-1 px-5 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                      >
                        Create Room
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsJoining(true)}
                        className="flex-1 px-5 py-3 bg-bg-secondary border border-border/60 hover:bg-bg-secondary/80 text-text-primary font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                      >
                        Join Room
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleJoin} className="w-full space-y-4 p-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter your name..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                      className="w-full px-4 py-3 bg-bg-tertiary/40 border border-border/80 rounded-xl text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-hover/20 transition-all duration-300"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Room code"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                      className="w-full px-4 py-3 bg-bg-tertiary/40 border border-border/80 rounded-xl text-text-primary text-sm tracking-widest text-center uppercase font-mono placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-accent-hover/20 transition-all duration-300"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsJoining(false)}
                        className="px-4 py-3 bg-bg-secondary border border-border/60 hover:bg-bg-secondary/80 text-text-primary rounded-xl text-sm transition-all duration-200 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="submit"
                        disabled={!nickname.trim() || !roomCodeInput.trim()}
                        className="flex-1 px-5 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <p className="mt-5 text-[11px] font-semibold tracking-wider text-text-tertiary uppercase">4–12 players · No downloads · Private rooms</p>
            </motion.div>

            <section className="w-full py-12 border-t border-border/50">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-text-secondary text-center mb-8">How to Play</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { step: '01', title: 'Receive your word', desc: 'Everyone gets the same secret word. One player gets a different but closely related word.' },
                  { step: '02', title: 'Describe it', desc: 'Each player gives one clue. Never say your actual word, spell it, or translate it.' },
                  { step: '03', title: 'Discuss & vote', desc: 'After all clues are heard, debate who sounds suspicious. Vote out the player you suspect.' },
                  { step: '04', title: 'Find the Echo', desc: 'If the odd player is voted out, everyone wins. If they survive, the Echo wins.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 12, filter: 'blur(2px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-border/60 bg-bg-secondary/40 p-6 flex flex-col gap-2 hover:border-border-hover/60 hover:bg-bg-secondary/70 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center border-b border-border/40 pb-2 w-full">
                      <span className="text-[11px] font-mono text-text-tertiary font-bold tracking-widest uppercase">Step {item.step}</span>
                    </div>
                    <h3 className="text-sm font-bold text-text-primary tracking-tight mt-1">{item.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            <footer className="w-full pb-8 pt-12 flex flex-col items-center gap-3 border-t border-border/30">
              <p className="text-[10px] font-semibold text-text-tertiary tracking-widest uppercase">Built for browsers · Made for liars</p>
            </footer>
          </main>
        </div>
      </PageTransition>
    )
  }

  // ─── RENDER: In Room ───
  const { status, code, players, settings, currentRound, currentSpeakerIndex, timerValue, publicWord, clues, revealedEchoId, winnerId } = roomState
  const currentSpeaker = players[currentSpeakerIndex]
  const isMyTurn = currentSpeaker?.id === socket?.id
  const lobbyPhase = 'lobby'

  return (
    <PageTransition>
      <div className="flex h-full flex-col bg-bg select-none">
        <GameHeader
          roomCode={code}
          phase={status.toLowerCase() as any}
          round={currentRound}
          playerCount={players.length}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center max-w-4xl mx-auto w-full">
          {/* ─── LOBBY ─── */}
          {status === 'LOBBY' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 w-full">
              <div className="flex items-center gap-4 pb-4 border-b border-border/80 w-full max-w-md justify-center">
                <span className="text-xs uppercase tracking-widest font-semibold text-text-tertiary">Room Code</span>
                <div className="flex items-center gap-2 bg-bg-secondary/40 border border-border/60 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  <span className="font-bold text-2xl tracking-widest text-text-primary font-mono">{code}</span>
                  <button onClick={handleCopyCode} className="p-1 hover:text-accent transition-colors cursor-pointer" title="Copy code">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-tertiary" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                  <span className="text-xs text-success font-medium">
                    {players.length} {players.length === 1 ? 'player' : 'players'}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-md space-y-2">
                {players.map((p) => (
                  <div key={p.id} className={cn(
                    'flex items-center justify-between p-3.5 bg-bg-secondary/20 border rounded-xl transition-all duration-200',
                    p.id === self?.id ? 'border-border-hover' : 'border-border/40'
                  )}>
                    <div className="flex items-center gap-2.5">
                      {p.isHost ? <Crown className="w-4 h-4 text-amber-500" /> : <div className="w-4 h-4" />}
                      <span className="font-medium text-sm text-text-primary">
                        {p.nickname} {p.id === self?.id && <span className="text-xs text-text-tertiary">(You)</span>}
                      </span>
                    </div>
                    <span className={cn(
                      'text-xs px-2.5 py-0.5 rounded-full font-medium',
                      p.isReady ? 'bg-success/10 border border-success/20 text-success' : 'bg-bg-tertiary border border-border/40 text-text-tertiary'
                    )}>
                      {p.isReady ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 w-full max-w-xs mt-4">
                <button
                  onClick={actions.toggleReady}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer',
                    self?.isReady
                      ? 'bg-bg-secondary border border-border/60 text-text-tertiary hover:text-text-primary hover:bg-bg-secondary/80'
                      : 'bg-accent hover:bg-accent-hover text-white'
                  )}
                >
                  {self?.isReady ? 'Cancel Ready' : 'Ready Up'}
                </button>

                {isHost && (
                  <>
                    <button
                      onClick={actions.startGame}
                      disabled={!players.every(p => p.isReady) || players.length < 4}
                      className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Game
                    </button>
                    {(!players.every(p => p.isReady) || players.length < 4) && (
                      <p className="text-[11px] text-center text-text-tertiary leading-tight">
                        Need at least 4 players. All must be ready.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── ASSIGNING ─── */}
          {status === 'ASSIGNING' && (
            <div className="flex flex-col items-center justify-center h-full">
              <WordReveal word={self?.word || null} visible />
            </div>
          )}

          {/* ─── CLUE PHASE ─── */}
          {status === 'CLUE' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <WordReveal word={self?.word || null} visible />

              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                  {isMyTurn ? 'Your turn' : `${currentSpeaker?.nickname}'s turn`}
                </p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Give one clue about your word.<br />Don't say it, spell it, or translate it.
                </p>
              </div>

              {isMyTurn && !self?.hasSpoken && (
                <div className="flex gap-2 w-full bg-bg-secondary/30 border border-border/60 p-2 rounded-2xl backdrop-blur-sm mt-2">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value.slice(0, 20))}
                    onKeyDown={(e) => e.key === 'Enter' && clueText.trim() && actions.submitClue(clueText.trim())}
                    placeholder="Type your clue..."
                    className="flex-1 h-[48px] rounded-xl border border-border bg-bg-tertiary/40 px-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-hover/20 transition-all duration-300"
                    autoFocus
                  />
                  <button
                    onClick={() => clueText.trim() && actions.submitClue(clueText.trim())}
                    disabled={!clueText.trim()}
                    className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              )}

              {!isMyTurn && (
                <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-text-secondary bg-bg-secondary/40 border border-border/60 px-4 py-2.5 rounded-full backdrop-blur-sm mt-2">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Listening to {currentSpeaker?.nickname || 'Speaker'}...
                </div>
              )}

              <Timer durationSeconds={settings.clueTimeSeconds} running paused={self?.hasSpoken || !isMyTurn} />
            </div>
          )}

          {/* ─── DISCUSSION ─── */}
          {status === 'DISCUSSION' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-base font-bold text-text-primary tracking-tight">Discussion</h2>
                <p className="text-xs text-text-secondary mt-1">All clues have been given. Discuss who sounds suspicious.</p>
              </div>

              <div className="w-full space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {clues.map((c) => {
                  const p = players.find(pl => pl.id === c.playerId)
                  return (
                    <div key={c.playerId} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-secondary/40 p-4">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-text-primary">{p?.nickname || 'Unknown'}</span>
                        <p className="text-xs text-text-secondary mt-0.5">{c.clue}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Timer durationSeconds={settings.discussTimeSeconds} running />
            </div>
          )}

          {/* ─── VOTING ─── */}
          {status === 'VOTING' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-base font-bold text-text-primary tracking-tight">Vote</h2>
                <p className="text-xs text-text-secondary mt-1">Who is the Echo?</p>
              </div>

              <VotePanel
                players={players.map(p => ({ ...p, username: p.nickname, avatar: '' })) as any}
                localPlayerId={socket?.id || null}
                hasVoted={self?.hasVoted || false}
                onVote={actions.castVote}
              />

              <Timer durationSeconds={settings.voteTimeSeconds} running />
            </div>
          )}

          {/* ─── REVEAL ─── */}
          {status === 'REVEAL' && (
            <div className="flex flex-col items-center justify-center h-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <p className="text-sm font-semibold tracking-wide text-text-secondary mb-4 uppercase">The votes are in...</p>
              </motion.div>
            </div>
          )}

          {/* ─── RESULTS ─── */}
          {status === 'RESULTS' && (
            <ResultsScreen
              players={players.map(p => ({ ...p, username: p.nickname, avatar: '' })) as any}
              revealedEchoId={revealedEchoId}
              votes={roomState.votes}
              onPlayAgain={actions.playAgain}
              onLeave={() => { }}
            />
          )}
        </main>

        {/* ─── Voice Bar ─── */}
        <div className="flex items-center gap-4 px-6 py-4 border-t border-border bg-bg-secondary/70 backdrop-blur-md">
          <button
            onClick={toggleLocalMute}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer',
              isMuted ? 'bg-error/10 border-error/20 text-error' : 'bg-bg-secondary border-border/60 text-text-secondary'
            )}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic'}</span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success' : 'bg-error')} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-20 inset-x-4 max-w-sm mx-auto bg-error/10 border border-error/20 backdrop-blur-md text-error px-4 py-2.5 rounded-xl text-xs font-semibold text-center shadow-lg z-40"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
