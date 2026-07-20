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
        <div className="flex h-full flex-col overflow-y-auto bg-bg bg-ambient">
          <main className="relative z-10 flex-1 flex flex-col items-center px-6 justify-center max-w-[640px] mx-auto w-full">

            {/* ─── Hero Block ─── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center pt-24 pb-6 w-full"
            >
              {/* Logo */}
              <motion.h1
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="text-[5.5rem] sm:text-[6.5rem] font-extrabold tracking-[-0.06em] text-text-primary select-none uppercase leading-none"
              >
                Echo
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 text-[15px] sm:text-base text-text-secondary max-w-[320px] leading-[1.7] font-normal tracking-[-0.008em]"
              >
                One room. One different word.
                <br />
                <span className="text-text-tertiary">Can you find the Echo?</span>
              </motion.p>

              {/* ─── Form Card ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 w-full max-w-[400px] surface-elevated rounded-2xl p-5"
              >
                <AnimatePresence mode="wait">
                  {!isJoining ? (
                    <motion.form
                      key="create"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      onSubmit={handleCreate}
                      className="w-full space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary pl-1">
                          Nickname
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter your name..."
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                          className="w-full input-premium"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="submit"
                          disabled={!nickname.trim()}
                          className="flex-1 btn-primary"
                        >
                          Create Room
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsJoining(true)}
                          className="flex-1 btn-secondary"
                        >
                          Join Room
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="join"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      onSubmit={handleJoin}
                      className="w-full space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary pl-1">
                          Nickname
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter your name..."
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value.slice(0, 12))}
                          className="w-full input-premium"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary pl-1">
                          Room Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. D7K2"
                          value={roomCodeInput}
                          onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                          className="w-full input-premium text-center uppercase tracking-[0.25em] font-mono placeholder:tracking-normal placeholder:font-sans"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsJoining(false)}
                          className="btn-secondary !px-4 !w-auto"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="submit"
                          disabled={!nickname.trim() || !roomCodeInput.trim()}
                          className="flex-1 btn-primary"
                        >
                          Join
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Meta line */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-7 text-[10px] font-medium tracking-[0.18em] text-text-tertiary uppercase select-none"
              >
                4–12 players · No downloads · Private rooms
              </motion.p>
            </motion.div>

            {/* ─── How to Play ─── */}
            <section className="w-full pt-16 pb-12">
              <div className="divider mb-12" />
              <motion.h2
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-tertiary text-center mb-10"
              >
                How to Play
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { step: '01', title: 'Receive your word', desc: 'Everyone gets the same secret word. One player gets a different but closely related word.' },
                  { step: '02', title: 'Describe it', desc: 'Each player gives one clue. Never say your actual word, spell it, or translate it.' },
                  { step: '03', title: 'Discuss & vote', desc: 'After all clues are heard, debate who sounds suspicious. Vote out the player you suspect.' },
                  { step: '04', title: 'Find the Echo', desc: 'If the odd player is voted out, everyone wins. If they survive, the Echo wins.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                    className="surface-card rounded-[18px] p-6 flex flex-col gap-3 hover:border-border-hover/40 transition-colors duration-300 cursor-default group"
                  >
                    <span className="text-[10px] font-mono text-text-tertiary font-semibold tracking-[0.15em] uppercase opacity-50 group-hover:opacity-80 transition-opacity duration-300">
                      {item.step}
                    </span>
                    <h3 className="text-[15px] font-semibold text-text-primary tracking-[-0.015em] leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-text-secondary leading-[1.65] font-normal tracking-[-0.003em]">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="w-full pb-10 pt-4 flex flex-col items-center gap-4">
              <div className="divider w-full" />
              <p className="mt-4 text-[10px] font-medium text-text-tertiary tracking-[0.2em] uppercase opacity-60 select-none">
                Built for browsers · Made for liars
              </p>
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
      <div className="flex h-full flex-col bg-bg bg-ambient select-none">
        <GameHeader
          roomCode={code}
          phase={status.toLowerCase() as any}
          round={currentRound}
          playerCount={players.length}
        />

        <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center max-w-3xl mx-auto w-full">
          {/* ─── LOBBY ─── */}
          {status === 'LOBBY' && (
            <div className="flex flex-col items-center justify-center h-full gap-8 w-full">
              {/* Room header */}
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  Room Code
                </span>
                <div className="flex items-center gap-3 surface-card px-5 py-3 rounded-2xl">
                  <span className="font-bold text-[28px] tracking-[0.2em] text-text-primary font-mono leading-none">{code}</span>
                  <button onClick={handleCopyCode} className="p-1.5 hover:text-accent rounded-lg hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer" title="Copy code">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-text-tertiary" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[11px] text-text-secondary font-medium tracking-wide">
                    {players.length} {players.length === 1 ? 'player' : 'players'} connected
                  </span>
                </div>
              </div>

              <div className="divider w-full max-w-md" />

              {/* Player list */}
              <div className="w-full max-w-md space-y-1.5">
                {players.map((p) => (
                  <div key={p.id} className={cn(
                    'flex items-center justify-between px-4 py-3.5 rounded-[14px] transition-all duration-200',
                    p.id === self?.id ? 'surface-card' : 'hover:bg-bg-secondary/30'
                  )}>
                    <div className="flex items-center gap-3">
                      {p.isHost ? <Crown className="w-3.5 h-3.5 text-amber-500/80" /> : <div className="w-3.5 h-3.5" />}
                      <span className="font-medium text-[14px] text-text-primary tracking-[-0.006em]">
                        {p.nickname}
                        {p.id === self?.id && <span className="text-[12px] text-text-tertiary ml-1.5 font-normal">(You)</span>}
                      </span>
                    </div>
                    <span className={cn(
                      'text-[11px] px-3 py-1 rounded-full font-medium tracking-wide',
                      p.isReady
                        ? 'bg-success/8 text-success'
                        : 'text-text-tertiary'
                    )}>
                      {p.isReady ? 'Ready' : 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                <button
                  onClick={actions.toggleReady}
                  className={cn(
                    'w-full h-[48px] rounded-[14px] font-semibold text-[14px] transition-all duration-200 cursor-pointer',
                    self?.isReady
                      ? 'btn-secondary'
                      : 'btn-primary'
                  )}
                >
                  {self?.isReady ? 'Cancel Ready' : 'Ready Up'}
                </button>

                {isHost && (
                  <>
                    <button
                      onClick={actions.startGame}
                      disabled={!players.every(p => p.isReady) || players.length < 4}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Start Game
                    </button>
                    {(!players.every(p => p.isReady) || players.length < 4) && (
                      <p className="text-[11px] text-center text-text-tertiary leading-snug tracking-[-0.003em] opacity-70">
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

              <div className="text-center mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-text-secondary mb-1.5">
                  {isMyTurn ? 'Your turn' : `${currentSpeaker?.nickname}'s turn`}
                </p>
                <p className="text-[13px] text-text-tertiary leading-[1.6] tracking-[-0.003em]">
                  Give one clue about your word.<br />Don't say it, spell it, or translate it.
                </p>
              </div>

              {isMyTurn && !self?.hasSpoken && (
                <div className="flex gap-2.5 w-full surface-elevated p-2.5 rounded-2xl mt-3">
                  <input
                    type="text"
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value.slice(0, 20))}
                    onKeyDown={(e) => e.key === 'Enter' && clueText.trim() && actions.submitClue(clueText.trim())}
                    placeholder="Type your clue..."
                    className="flex-1 input-premium"
                    autoFocus
                  />
                  <button
                    onClick={() => clueText.trim() && actions.submitClue(clueText.trim())}
                    disabled={!clueText.trim()}
                    className="btn-primary !h-[52px] !px-7"
                  >
                    Submit
                  </button>
                </div>
              )}

              {!isMyTurn && (
                <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary surface-card px-5 py-3 rounded-full mt-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
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
                <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.02em]">Discussion</h2>
                <p className="text-[13px] text-text-secondary mt-1.5 tracking-[-0.003em]">All clues have been given. Discuss who sounds suspicious.</p>
              </div>

              <div className="w-full space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
                {clues.map((c) => {
                  const p = players.find(pl => pl.id === c.playerId)
                  return (
                    <div key={c.playerId} className="flex items-center gap-3 rounded-[14px] surface-card p-4 hover:border-border-hover/30 transition-colors duration-200">
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-text-primary tracking-[-0.006em]">{p?.nickname || 'Unknown'}</span>
                        <p className="text-[13px] text-text-secondary mt-0.5 tracking-[-0.003em]">{c.clue}</p>
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
                <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.02em]">Vote</h2>
                <p className="text-[13px] text-text-secondary mt-1.5 tracking-[-0.003em]">Who is the Echo?</p>
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
        <div className="flex items-center gap-4 px-6 py-3.5 border-t border-border bg-bg-secondary/50 backdrop-blur-xl">
          <button
            onClick={toggleLocalMute}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-[12px] font-semibold transition-all duration-200 cursor-pointer',
              isMuted
                ? 'bg-error/8 text-error/80 hover:bg-error/12'
                : 'bg-bg-tertiary/40 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/60'
            )}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic On'}</span>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-[11px] text-text-tertiary font-medium tracking-wide">
            <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-success' : 'bg-error')} />
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
