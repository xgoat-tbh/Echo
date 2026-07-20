import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Crown, Mic, MicOff, Play, ArrowLeft, Send, Settings, X, LogOut, Users, MessageSquare, Link2, Sun, Moon } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { useSocket, type Player } from './hooks/useSocket'
import { PageTransition } from './motion/PageTransition'
import { GameHeader } from './game/components/GameHeader'
import { WordReveal } from './game/components/WordReveal'
import { VotePanel } from './game/components/VotePanel'
import { ResultsScreen } from './game/components/ResultsScreen'
import { Timer } from './game/components/Timer'
import { PhaseBanner } from './game/components/PhaseBanner'
import { Confetti } from './game/components/Confetti'
import { CustomSelect } from './game/components/CustomSelect'
import { CustomCheckbox } from './game/components/CustomCheckbox'
import { cn } from './lib/cn'
import { config } from './config'
import { getPlayerColor } from './game/playerColors'
import { useTheme } from './hooks/useTheme'
import { CustomWordsModal } from './game/components/CustomWordsModal'

export default function App() {
  const { roomState, error, isConnected, connectError, voiceOffer, voiceAnswer, iceCandidate, actions, socket } = useSocket()

  const [nickname, setNickname] = useState(() => localStorage.getItem('echo_nickname') || '')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [clueText, setClueText] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [spectatorCopied, setSpectatorCopied] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [bannerPhase, setBannerPhase] = useState('')
  const [clueShake, setClueShake] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [showRoomBrowser, setShowRoomBrowser] = useState(false)
  const [playerKey, setPlayerKey] = useState(() => localStorage.getItem('echo_player_key') || '')
  const [keyInput, setKeyInput] = useState('')
  const [showKeyPanel, setShowKeyPanel] = useState(false)
  const [showCustomWords, setShowCustomWords] = useState(false)

  const { isLight, toggle: toggleTheme } = useTheme()

  // Voice P2P
  const [isMuted, setIsMuted] = useState(false)
  const [pttMode, setPttMode] = useState(false)
  const [pttHeld, setPttHeld] = useState(false)
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
        video: false,
      })
      localStreamRef.current = stream
      stream.getAudioTracks().forEach(track => { track.enabled = !isMuted })
      connectToPeers()
    } catch { }
  }

  // ─── PTT ───
  useEffect(() => {
    if (!pttMode) return

    const down = (e: KeyboardEvent) => {
      if ((e.key === 'v' || e.key === 'V') && localStreamRef.current && !pttHeld) {
        setPttHeld(true)
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true })
        setIsMuted(false)
        actions.toggleMute(false)
      }
    }
    const up = (e: KeyboardEvent) => {
      if ((e.key === 'v' || e.key === 'V') && localStreamRef.current) {
        setPttHeld(false)
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false })
        setIsMuted(true)
        actions.toggleMute(true)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    // Start muted
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false })
      setIsMuted(true)
      actions.toggleMute(true)
    }
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [pttMode])

  const startPtt = () => {
    if (!localStreamRef.current) return
    setPttHeld(true)
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true })
    setIsMuted(false)
    actions.toggleMute(false)
  }

  const endPtt = () => {
    if (!localStreamRef.current) return
    setPttHeld(false)
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false })
    setIsMuted(true)
    actions.toggleMute(true)
  }

  const togglePttMode = () => {
    const next = !pttMode
    setPttMode(next)
    if (next && localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false })
      setIsMuted(true)
      actions.toggleMute(true)
    }
  }

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
        audio.setAttribute('playsinline', '')
        audio.autoplay = true
        audio.volume = 1
        audio.play().catch(() => {})
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

  const toggleLocalMute = async () => {
    if (!localStreamRef.current) {
      await initLocalAudio()
    }
    const next = !isMuted
    setIsMuted(next)
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next })
    actions.toggleMute(next)
  }

  // ─── Player key system ───
  useEffect(() => {
    if (!playerKey) {
      const key = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 30)]).join('')
      setPlayerKey(key)
      localStorage.setItem('echo_player_key', key)
    }
  }, [])

  const handleLoadKey = () => {
    const k = keyInput.trim().toUpperCase()
    if (k.length >= 4) {
      localStorage.setItem('echo_player_key', k)
      setPlayerKey(k)
      setKeyInput('')
      setShowKeyPanel(false)
    }
  }

  // ─── Haptic feedback ───
  const haptic = (ms = 10) => { try { navigator.vibrate(ms) } catch {} }

  // ─── Sound effects ───
  const beepRef = useRef<AudioContext | null>(null)
  const playBeep = (type: 'turn' | 'phase' | 'vote') => {
    try {
      if (!beepRef.current) beepRef.current = new AudioContext()
      const ctx = beepRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.1
      if (type === 'turn') { osc.frequency.value = 660; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); haptic(15) }
      else if (type === 'phase') { osc.frequency.value = 880; osc.type = 'triangle'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); haptic(30) }
      else { osc.frequency.value = 440; osc.type = 'sawtooth'; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); haptic(10) }
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  // Play sound on phase change or turn change
  const prevPhaseRef = useRef(roomState?.status)
  const prevSpeakerRef = useRef(roomState?.currentSpeakerIndex)
  useEffect(() => {
    if (!roomState) return
    if (prevPhaseRef.current && prevPhaseRef.current !== roomState.status) {
      playBeep('phase')
      setBannerPhase(roomState.status)
      setShowBanner(true)
      const t = setTimeout(() => setShowBanner(false), 1600)
      return () => clearTimeout(t)
    }
    if (prevSpeakerRef.current !== roomState.currentSpeakerIndex && roomState.status === 'CLUE') {
      playBeep('turn')
    }
    prevPhaseRef.current = roomState.status
    prevSpeakerRef.current = roomState.currentSpeakerIndex
  }, [roomState?.status, roomState?.currentSpeakerIndex])

  // ─── Reconnect: store session data ───
  useEffect(() => {
    if (roomState) {
      localStorage.setItem('echo_nickname', nickname)
      sessionStorage.setItem('echo_room_code', roomState.code)
    }
  }, [roomState?.code])

  // Auto-reconnect on mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem('echo_room_code')
    const savedNick = localStorage.getItem('echo_nickname')
    if (savedCode && savedNick && socket?.connected && !roomState) {
      actions.reconnect(savedCode, savedNick)
    }
  }, [socket?.connected])

  // ─── Spectator mode from URL ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const spectateCode = params.get('spectate')
    if (spectateCode && socket?.connected) {
      actions.joinAsSpectator(spectateCode.toUpperCase())
    }
  }, [socket?.connected])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) return
    sessionStorage.setItem('echo_nickname', nickname.trim())
    actions.createRoom(nickname.trim())
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim() || !roomCodeInput.trim()) return
    sessionStorage.setItem('echo_nickname', nickname.trim())
    actions.joinRoom(roomCodeInput.trim().toUpperCase(), nickname.trim())
  }

  // ─── RENDER: No room → Landing ───
  if (!roomState) {
    return (
      <PageTransition>
        <div className="flex h-full flex-col overflow-y-auto bg-bg bg-ambient relative">
          {/* Background particles */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#FF8A5C'][i % 5],
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.15, 0.4, 0.15],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>
          <main className="relative z-10 flex flex-col items-center px-6 max-w-[640px] mx-auto w-full">

            {/* ─── Hero Block ─── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center pt-20 sm:pt-24 pb-6 w-full"
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

              {/* ─── Connection Status ─── */}
              {connectError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 w-full max-w-[400px] px-4 py-2.5 rounded-xl text-xs font-semibold text-center text-error bg-error/10 border border-error/20"
                >
                  {connectError}
                </motion.div>
              )}
              {!isConnected && !connectError && (
                <div className="mb-4 w-full max-w-[400px] px-4 py-2.5 rounded-xl text-xs font-semibold text-center text-text-tertiary bg-bg-tertiary/30 border border-border/40">
                  Connecting to server...
                </div>
              )}

              {/* ─── Form Card ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1 w-full max-w-[400px] surface-elevated rounded-2xl p-5"
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
                          disabled={!nickname.trim() || !isConnected}
                          className="flex-1 btn-primary"
                        >
                          {isConnected ? 'Create Room' : 'Connecting...'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsJoining(true)}
                          disabled={!isConnected}
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
                          disabled={!nickname.trim() || !roomCodeInput.trim() || !isConnected}
                          className="flex-1 btn-primary px-5"
                        >
                          {isConnected ? 'Join' : 'Connecting...'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Room browser + Player Key */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center gap-3 mt-5"
              >
                <button onClick={() => { actions.listRooms(); setShowRoomBrowser(!showRoomBrowser) }} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-bg-tertiary/30">
                  Browse Rooms
                </button>
                <span className="h-3 w-px bg-border/40" />
                <button onClick={() => setShowKeyPanel(!showKeyPanel)} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-bg-tertiary/30">
                  My Key
                </button>
              </motion.div>

              {/* Room Browser Panel */}
              <AnimatePresence>
                {showRoomBrowser && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="w-full max-w-[400px] surface-card rounded-2xl p-4 mt-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-text-tertiary">Open Rooms</p>
                      <button onClick={() => actions.listRooms()} className="text-[10px] text-accent hover:text-accent/80 font-semibold uppercase tracking-[0.1em] cursor-pointer">Refresh</button>
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      <p className="text-[12px] text-text-tertiary text-center py-4">Click refresh to find rooms</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player Key Panel */}
              <AnimatePresence>
                {showKeyPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="w-full max-w-[400px] surface-card rounded-2xl p-4 mt-2 overflow-hidden"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-text-tertiary mb-2">Your Player Key</p>
                    <p className="text-[11px] text-text-secondary mb-3 leading-[1.6]">Use this key on another device to keep your name and stats.</p>
                    <div className="flex items-center gap-2 surface-elevated px-3 py-2 rounded-xl mb-3">
                      <span className="flex-1 font-mono font-bold text-[16px] tracking-[0.2em] text-text-primary select-all">{playerKey}</span>
                      <button onClick={() => { navigator.clipboard.writeText(playerKey); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-1.5 hover:text-accent rounded-lg hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer">
                        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-tertiary" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={keyInput} onChange={(e) => setKeyInput(e.target.value.toUpperCase().slice(0, 8))} onKeyDown={(e) => e.key === 'Enter' && handleLoadKey()} placeholder="Paste a key..." className="flex-1 input-premium !py-1.5 !text-[12px]" />
                      <button onClick={handleLoadKey} disabled={keyInput.trim().length < 4} className="btn-primary !h-auto !px-4 !py-1.5 !text-[11px] cursor-pointer">Load</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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

          {/* Theme toggle — always visible on landing */}
          <button
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold text-text-tertiary hover:text-text-primary bg-bg-secondary/60 backdrop-blur-md hover:bg-bg-tertiary/60 border border-border/40 transition-all duration-200 cursor-pointer"
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </PageTransition>
    )
  }

  // ─── RENDER: In Room ───
  const { status, code, players, settings, currentRound, currentSpeakerIndex, clueOrder, timerValue, publicWord, clues, revealedEchoId, winnerId } = roomState
  const speakerPlayerIdx = clueOrder?.length > 0 && currentSpeakerIndex >= 0 ? clueOrder[currentSpeakerIndex] : currentSpeakerIndex
  const currentSpeaker = speakerPlayerIdx >= 0 ? players[speakerPlayerIdx] : undefined
  const isMyTurn = currentSpeaker?.id === socket?.id
  const phaseBg: Record<string, string> = {
    LOBBY: '',
    ASSIGNING: 'bg-gradient-to-b from-bg via-accent/3 to-bg',
    CLUE: 'bg-gradient-to-b from-bg via-blue-950/10 to-bg',
    DISCUSSION: 'bg-gradient-to-b from-bg via-amber-950/8 to-bg',
    VOTING: 'bg-gradient-to-b from-bg via-error/5 to-bg',
    REVEAL: 'bg-gradient-to-b from-bg via-error/3 to-bg',
    RESULTS: 'bg-gradient-to-b from-bg via-success/5 to-bg',
  }

  return (
    <PageTransition>
      <div className={cn('flex h-full flex-col bg-bg bg-ambient select-none', phaseBg[status] || '')}>
        <GameHeader
          roomCode={code}
          phase={status.toLowerCase() as any}
          round={currentRound}
          playerCount={players.length}
        />

        {status !== 'LOBBY' && status !== 'ASSIGNING' && status !== 'RESULTS' && (
          <PhaseBanner phase={bannerPhase} show={showBanner} />
        )}

        <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col max-w-3xl mx-auto w-full">
          {/* ─── LOBBY ─── */}
          {status === 'LOBBY' && (
            <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full gap-6 md:gap-10 w-full max-w-5xl mx-auto md:pt-8">

              {/* ─── LEFT: Room Header + Players ─── */}
              <div className="flex flex-col items-center md:items-start gap-5 w-full md:flex-1 md:max-w-lg">

                {/* Room header — modern HUD */}
                <div className="flex flex-col items-center md:items-start gap-3 w-full">
                  <div className="flex items-center gap-2.5 surface-card px-5 py-3 rounded-2xl w-full md:w-auto">
                    <div className="flex items-center gap-3 flex-1 md:flex-none">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-text-tertiary shrink-0">Room</span>
                      <span className="font-bold text-[28px] tracking-[0.2em] text-text-primary font-mono leading-none select-all">{code}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto md:ml-2">
                      <button onClick={handleCopyCode} className="p-1.5 hover:text-accent rounded-lg hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer" title="Copy code">
                        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-text-tertiary" />}
                      </button>
                      {isHost && (
                        <button onClick={() => { const url = `${window.location.origin}?spectate=${code}`; navigator.clipboard.writeText(url); setSpectatorCopied(true); setTimeout(() => setSpectatorCopied(false), 2000) }} className="p-1.5 hover:text-accent rounded-lg hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer" title="Copy spectator watch link">
                          {spectatorCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5 text-text-tertiary" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full md:w-auto gap-4 px-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success' : 'bg-error')} />
                        <span className="text-[11px] text-text-secondary font-medium tracking-wide">{players.length} player{players.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="h-3 w-px bg-border/40" />
                      <span className="text-[11px] text-text-tertiary font-medium tracking-wide">{settings.numEchoes} Echo{settings.numEchoes > 1 ? 'es' : ''}</span>
                      <span className="h-3 w-px bg-border/40" />
                      <span className="text-[11px] text-text-tertiary font-medium capitalize">{settings.wordPack === 'mixed' ? 'Any Pack' : settings.wordPack}</span>
                    </div>
                    {isHost && (
                      <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-1.5 text-[11px] text-text-tertiary hover:text-text-primary transition-colors duration-200 cursor-pointer">
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </button>
                    )}
                  </div>
                </div>

                <div className="divider w-full" />

                {/* Player list — premium cards */}
                <div className="w-full space-y-1.5 md:max-h-[55vh] md:overflow-y-auto md:pr-1">
                  {players.map((p, idx) => {
                    const color = getPlayerColor(p.id, idx)
                    const isSelf = p.id === self?.id
                    return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -1, transition: { duration: 0.15 } }}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-[14px] transition-all duration-200',
                        isSelf ? 'surface-card' : 'hover:bg-bg-secondary/40'
                      )}
                      style={isSelf ? { boxShadow: `0 0 0 1px ${color}25, 0 4px 16px ${color}08` } : {}}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar circle */}
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
                            {p.nickname.charAt(0).toUpperCase()}
                          </div>
                          {p.isHost && (
                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                              <Crown className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[14px] text-text-primary tracking-[-0.006em] truncate">
                              {p.nickname}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-medium text-text-tertiary bg-bg-tertiary/30 px-1.5 py-0.5 rounded-md">You</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                              'text-[10px] font-medium',
                              p.isReady ? 'text-success' : 'text-text-tertiary'
                            )}>
                              {p.isReady ? 'Ready' : 'Not Ready'}
                            </span>
                            <span className="text-[9px] text-text-tertiary/50">·</span>
                            <span className="text-[10px] text-text-tertiary">{p.isMuted ? 'Muted' : 'Mic On'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isHost && p.id !== self?.id && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => actions.kickPlayer(p.id)}
                            className="p-1.5 rounded-lg hover:bg-error/10 text-text-tertiary hover:text-error transition-all duration-200 cursor-pointer"
                            title={`Kick ${p.nickname}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )})}
                  {roomState.spectators?.length > 0 && (
                    <div className="px-4 py-2.5 text-[11px] text-text-tertiary font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      {roomState.spectators.length} spectator{roomState.spectators.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── RIGHT: Start + Settings panel ─── */}
              <div className="flex flex-col gap-3 w-full md:w-80 md:sticky md:top-8">

                {/* Start / Ready panel */}
                <div className="w-full surface-card rounded-2xl p-5 space-y-4">
                  {!settings.autoReady && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">Your Status</p>
                      <motion.button
                        onClick={() => { actions.toggleReady(); haptic(10) }}
                        whileTap={self?.isReady ? { scale: 0.98 } : { scale: 0.97 }}
                        className={cn(
                          'w-full h-[52px] rounded-[14px] font-bold text-[15px] transition-all duration-200 cursor-pointer relative overflow-hidden',
                          self?.isReady
                            ? 'bg-bg-secondary border border-border/60 text-text-secondary hover:border-border-hover/40'
                            : 'bg-accent text-text-inverse hover:brightness-110 shadow-lg shadow-accent/20'
                        )}
                      >
                        <motion.span
                          key={self?.isReady ? 'ready' : 'notready'}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {self?.isReady ? 'Cancel Ready' : 'Ready Up'}
                        </motion.span>
                      </motion.button>
                    </div>
                  )}

                  {isHost && (
                    <div className="space-y-3">
                      <div className="divider" />
                      <motion.button
                        onClick={actions.startGame}
                        disabled={players.length < 4}
                        whileTap={players.length >= 4 ? { scale: 0.97 } : {}}
                        className={cn(
                          'w-full h-[52px] rounded-[14px] font-bold text-[15px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 relative overflow-hidden',
                          players.length >= 4
                            ? 'bg-accent text-text-inverse hover:brightness-110 shadow-lg shadow-accent/20'
                            : 'bg-bg-tertiary/30 text-text-tertiary cursor-not-allowed'
                        )}
                      >
                        <Play className="w-4 h-4 fill-current" /> Start Game
                      </motion.button>
                      {players.length < 4 && (
                        <p className="text-[11px] text-center text-text-tertiary leading-snug tracking-[-0.003em]">{players.length}/4 players needed</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <CustomCheckbox
                          checked={settings.autoReady}
                          onChange={(v) => actions.updateSettings({ autoReady: v })}
                          label="Auto-ready"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings panel — horizontal grid */}
                {showSettings && isHost && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full surface-card rounded-2xl p-5 space-y-5"
                  >
                    {/* Timers row */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-3">Timers</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['clueTimeSeconds', 'discussTimeSeconds', 'voteTimeSeconds'] as const).map(key => (
                          <div key={key}>
                            <p className="text-[9px] font-medium text-text-tertiary mb-1.5 capitalize truncate">{key.replace('TimeSeconds', '').replace(/([A-Z])/g, ' $1').trim()}</p>
                            <input type="number" min={10} max={300} step={5} value={settings[key]}
                              onChange={(e) => actions.updateSettings({ [key]: Math.max(10, Math.min(300, parseInt(e.target.value) || 10)) })}
                              className="w-full text-center input-premium !py-2 !text-[13px] font-semibold rounded-[10px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="divider" />

                    {/* Game settings row */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-3">Game</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <CustomSelect
                          options={[
                            { value: '1', label: '1 Echo' },
                            { value: '2', label: '2 Echoes' },
                            { value: '3', label: '3 Echoes' },
                          ]}
                          value={String(settings.numEchoes)}
                          onChange={(v) => actions.updateSettings({ numEchoes: parseInt(v) })}
                          label="Echoes"
                        />
                        <CustomSelect
                          options={[
                            { value: 'easy', label: 'Easy' },
                            { value: 'normal', label: 'Normal' },
                            { value: 'hard', label: 'Hard' },
                          ]}
                          value={settings.wordDifficulty}
                          onChange={(v) => actions.updateSettings({ wordDifficulty: v as any })}
                          label="Difficulty"
                        />
                        <CustomSelect
                          options={[
                            { value: 'mixed', label: 'Mixed' },
                            { value: 'animals', label: 'Animals' },
                            { value: 'food', label: 'Food' },
                            { value: 'nature', label: 'Nature' },
                            { value: 'objects', label: 'Objects' },
                            { value: 'fantasy', label: 'Fantasy' },
                            { value: 'custom', label: 'Custom' },
                          ]}
                          value={settings.wordPack}
                          onChange={(v) => actions.updateSettings({ wordPack: v })}
                          label="Word Pack"
                        />
                        {settings.wordPack === 'custom' && (
                          <button
                            onClick={() => setShowCustomWords(true)}
                            className="col-span-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[12px] font-semibold bg-rose/10 text-rose hover:bg-rose/20 border border-rose/20 transition-all duration-200 cursor-pointer"
                          >
                            Manage Custom Word Pairs
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="divider" />

                    {/* Toggles row */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-3">Features</p>
                      <div className="flex items-center gap-6">
                        <CustomCheckbox
                          checked={settings.enableVoice}
                          onChange={(v) => actions.updateSettings({ enableVoice: v })}
                          label="Voice Chat"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Spectator info */}
                {!isHost && (
                  <div className="w-full surface-card rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-text-tertiary">Waiting for host to start...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ASSIGNING ─── */}
          {status === 'ASSIGNING' && (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              {/* Step 1: Role reveal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'rounded-[20px] p-5 px-10 text-center relative overflow-hidden',
                  self?.isEcho
                    ? 'bg-error/10 border border-error/20'
                    : 'bg-success/10 border border-success/20'
                )}
              >
                {self?.isEcho && (
                  <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0"
                    style={{ boxShadow: 'inset 0 0 60px hsla(358,68%,48%,0.1)' }}
                  />
                )}
                <motion.span
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className={cn(
                    'text-[13px] font-extrabold uppercase tracking-[0.15em]',
                    self?.isEcho ? 'text-error' : 'text-success'
                  )}
                >
                  {self?.isEcho ? 'You are the Echo' : 'You are a Commoner'}
                </motion.span>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="text-[11px] text-text-tertiary mt-2 font-medium"
                >
                  {self?.isEcho
                    ? 'Your word is different — blend in!'
                    : 'Find the player with the odd word.'
                  }
                </motion.p>
              </motion.div>

              {/* Step 2: Common word */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="surface-elevated rounded-[20px] p-6 text-center max-w-[340px] w-full"
              >
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-text-tertiary mb-3">
                  The Common Word
                </p>
                <p className="text-[28px] font-extrabold text-text-primary tracking-[0.08em] select-none uppercase">
                  {publicWord}
                </p>
                <div className="divider mt-4 mb-3" />
                <p className="text-[11px] text-text-tertiary leading-[1.6]">
                  All commoners describe this word.<br />
                  The Echo describes a different word.
                </p>
              </motion.div>

              {/* Step 3: Your secret word */}
              <WordReveal word={self?.word || null} visible />
            </div>
          )}

          {/* ─── CLUE PHASE ─── */}
          {status === 'CLUE' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-6 pt-4 w-full">
              <div className="surface-elevated rounded-[20px] p-6 text-center max-w-[340px] w-full">
                <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-text-tertiary mb-3">
                  The Word Is
                </p>
                <p className="text-[28px] font-extrabold text-text-primary tracking-[0.08em] select-none uppercase">
                  {publicWord}
                </p>
              </div>
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
                <div className="w-full mt-3">
                  <motion.div
                    className={cn('flex gap-2.5 w-full surface-elevated p-2.5 rounded-2xl', clueShake ? 'border border-error/40' : '')}
                    animate={clueShake ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="text"
                      value={clueText}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 20)
                        setClueText(val)
                        if (publicWord && val.toLowerCase().includes(publicWord.toLowerCase())) {
                          setClueShake(true)
                          setTimeout(() => setClueShake(false), 600)
                          playBeep('vote')
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && clueText.trim() && !clueShake && actions.submitClue(clueText.trim())}
                      placeholder="Type your clue..."
                      className="flex-1 input-premium"
                      autoFocus
                    />
                    <button
                      onClick={() => clueText.trim() && !clueShake && actions.submitClue(clueText.trim())}
                      disabled={!clueText.trim()}
                      className="btn-primary !h-[52px] !px-7"
                    >
                      Submit
                    </button>
                  </motion.div>
                  <div className="flex justify-between px-1 mt-1.5">
                    <span className="text-[10px] text-text-tertiary font-medium">{clueText.length}/20</span>
                    {publicWord && clueText.toLowerCase().includes(publicWord.toLowerCase()) && (
                      <span className="text-[10px] text-error/80 font-semibold">Don't type the word!</span>
                    )}
                  </div>
                </div>
              )}

              {/* Speaker queue — Find the Fox style */}
              {clueOrder?.length > 0 && (
                <div className="w-full mt-2">
                  <div className="flex items-center justify-center gap-1">
                    {clueOrder.map((playerIdx, orderIdx) => {
                      const p = players[playerIdx]
                      if (!p) return null
                      const isPast = orderIdx < currentSpeakerIndex
                      const isCurrent = orderIdx === currentSpeakerIndex
                      const isUpcoming = orderIdx > currentSpeakerIndex
                      const color = getPlayerColor(p.id, playerIdx)
                      return (
                        <motion.div
                          key={orderIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{
                            opacity: isCurrent ? 1 : isPast ? 0.5 : 0.7,
                            y: 0,
                            scale: isCurrent ? 1.15 : 1,
                          }}
                          transition={{ duration: 0.3, delay: orderIdx * 0.03 }}
                          className="relative"
                        >
                          {/* Speaking glow ring for current speaker */}
                          {isCurrent && (
                            <motion.div
                              animate={{ opacity: [0.4, 0.8, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute -inset-1 rounded-full"
                              style={{ boxShadow: `0 0 12px ${color}60` }}
                            />
                          )}
                          <div
                            className={cn(
                              'relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300',
                              isCurrent ? 'ring-2' : '',
                              isPast ? 'opacity-60 grayscale' : ''
                            )}
                            style={{
                              backgroundColor: isCurrent ? `${color}35` : `${color}18`,
                              color,
                              boxShadow: isCurrent ? `0 0 0 2px ${color}80` : 'none',
                            }}
                          >
                            {isPast ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              p.nickname.charAt(0).toUpperCase()
                            )}
                          </div>
                          {/* Name label */}
                          <span
                            className={cn(
                              'block text-[8px] font-semibold text-center mt-0.5 max-w-[36px] truncate transition-all duration-200',
                              isCurrent ? 'text-text-primary' : 'text-text-tertiary'
                            )}
                          >
                            {isCurrent ? 'YOU' : p.nickname.slice(0, 4)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                  {/* Status text */}
                  <p className="text-[10px] text-center text-text-tertiary font-medium mt-2 tracking-wide">
                    {isMyTurn
                      ? 'Your turn to give a clue'
                      : `Waiting for ${currentSpeaker?.nickname || 'Speaker'}...`
                    }
                  </p>
                </div>
              )}

              <Timer durationSeconds={settings.clueTimeSeconds} running paused={self?.hasSpoken || !isMyTurn} />
            </div>
          )}

          {/* ─── DISCUSSION ─── */}
          {status === 'DISCUSSION' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-4 pt-4 w-full">
              <div className="text-center">
                <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.02em]">Discussion</h2>
                <p className="text-[13px] text-text-secondary mt-1.5 tracking-[-0.003em]">All clues have been given. Discuss who sounds suspicious.</p>
              </div>

              <div className="w-full space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                {clues.map((c) => {
                  const p = players.find(pl => pl.id === c.playerId)
                  return (
                    <div key={c.playerId} className="flex items-center gap-3 rounded-[14px] surface-card p-4 transition-colors duration-200">
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-text-primary tracking-[-0.006em]">{p?.nickname || 'Unknown'}</span>
                        <p className="text-[13px] text-text-secondary mt-0.5 tracking-[-0.003em]">{c.clue}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chat */}
              {roomState.chatMessages && (
                <div className="w-full max-h-[25vh] overflow-y-auto space-y-1 pr-1 border-t border-border pt-3">
                  {roomState.chatMessages.map((msg, i) => {
                    const player = players.find(p => p.id === msg.playerId)
                    const color = player ? getPlayerColor(player.id, players.indexOf(player)) : undefined
                    const highlighted = msg.text.replace(/@(\w+)/g, '<span class="text-accent font-semibold">@$1</span>')
                    return (
                      <div key={i} className="flex items-start gap-2 px-1">
                        <span className="text-[11px] font-semibold shrink-0" style={color ? { color } : {}}>{msg.nickname}:</span>
                        <span className="text-[11px] text-text-secondary leading-[1.5]" dangerouslySetInnerHTML={{ __html: highlighted }} />
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-2 w-full surface-elevated p-2 rounded-2xl">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                  onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))}
                  placeholder='Chat... (@name to mention)'
                  className="flex-1 input-premium !py-2"
                />
                <button onClick={() => chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))} disabled={!chatInput.trim()} className="btn-primary !h-auto !px-4 !py-2 cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={actions.skipDiscussion}
                className="px-6 py-2.5 bg-bg-secondary border border-border/60 hover:bg-bg-secondary/80 text-text-primary font-semibold rounded-xl text-xs transition-all duration-200 cursor-pointer"
              >
                Skip to Voting
              </button>

              <Timer durationSeconds={settings.discussTimeSeconds} running />
            </div>
          )}

          {/* ─── VOTING ─── */}
          {status === 'VOTING' && (
            <div className="flex flex-col items-center max-w-lg mx-auto gap-4 pt-4 w-full">
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

              {/* Vote progress bar */}
              {(() => {
                const voted = players.filter(p => p.hasVoted).length
                const total = players.length
                const pct = total > 0 ? (voted / total) * 100 : 0
                return (
                  <div className="w-full flex items-center gap-3 px-1">
                    <div className="flex-1 h-[4px] rounded-full bg-bg-tertiary overflow-hidden">
                      <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-text-secondary tabular-nums">{voted}/{total}</span>
                  </div>
                )
              })()}

              {/* Chat during voting */}
              {roomState.chatMessages && (
                <div className="w-full max-h-[15vh] overflow-y-auto space-y-1 pr-1 border-t border-border pt-3">
                  {roomState.chatMessages.map((msg, i) => {
                    const player = players.find(p => p.id === msg.playerId)
                    const color = player ? getPlayerColor(player.id, players.indexOf(player)) : undefined
                    const highlighted = msg.text.replace(/@(\w+)/g, '<span class="text-accent font-semibold">@$1</span>')
                    return (
                      <div key={i} className="flex items-start gap-2 px-1">
                        <span className="text-[11px] font-semibold shrink-0" style={color ? { color } : {}}>{msg.nickname}:</span>
                        <span className="text-[11px] text-text-secondary leading-[1.5]" dangerouslySetInnerHTML={{ __html: highlighted }} />
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-2 w-full surface-elevated p-2 rounded-2xl">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                  onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))}
                  placeholder='Chat... (@name to mention)'
                  className="flex-1 input-premium !py-2"
                />
                <button onClick={() => chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))} disabled={!chatInput.trim()} className="btn-primary !h-auto !px-4 !py-2 cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <Timer durationSeconds={settings.voteTimeSeconds} running />
            </div>
          )}

          {/* ─── REVEAL ─── */}
          {status === 'REVEAL' && (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center w-full max-w-sm"
              >
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-sm font-semibold tracking-wide text-text-secondary mb-6 uppercase"
                >
                  The votes are in...
                </motion.p>

                {/* Tie */}
                {!revealedEchoId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-3"
                  >
                    <span className="text-[40px] font-extrabold text-text-primary tracking-[-0.04em]">
                      Tie Vote
                    </span>
                    <p className="text-[13px] text-text-secondary">No one was eliminated this round.</p>
                  </motion.div>
                )}

                {/* Eliminated player reveal */}
                {revealedEchoId && (() => {
                  const eliminated = players.find(p => p.id === revealedEchoId)
                  if (!eliminated) return null
                  const isEcho = roomState.players.find(p => p.id === revealedEchoId)?.isEcho || false
                  const color = getPlayerColor(eliminated.id, players.indexOf(eliminated))
                  const voteCount = roomState.votes.filter(v => v.targetId === revealedEchoId).length
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="surface-elevated rounded-[20px] p-6 text-center relative overflow-hidden"
                    >
                      {/* Pulsing glow */}
                      <motion.div
                        animate={{ opacity: [0.08, 0.2, 0.08] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0"
                        style={{
                          background: isEcho
                            ? `radial-gradient(circle at center, hsla(358,68%,48%,0.15), transparent 70%)`
                            : `radial-gradient(circle at center, hsla(142,52%,42%,0.15), transparent 70%)`
                        }}
                      />
                      <div className="relative z-10">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                          className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-3"
                          style={{ color: isEcho ? 'var(--color-error)' : 'var(--color-success)' }}
                        >
                          {isEcho ? 'Eliminated — They were the Echo!' : 'Eliminated — They were a Commoner'}
                        </motion.p>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 15 }}
                          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-[22px] font-bold"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                            boxShadow: isEcho ? `0 0 20px ${color}40` : 'none',
                          }}
                        >
                          {eliminated.nickname.charAt(0).toUpperCase()}
                        </motion.div>
                        <span className="text-[18px] font-bold text-text-primary tracking-[-0.02em]">{eliminated.nickname}</span>
                        <div className="divider my-3" />
                        <p className="text-[11px] text-text-secondary">
                          Received <span className="font-bold text-text-primary">{voteCount}</span> vote{voteCount !== 1 ? 's' : ''}
                        </p>
                        {isEcho && eliminated.word && (
                          <p className="text-[11px] text-text-secondary mt-1">
                            Their secret word: <span className="font-mono font-semibold text-error uppercase">{eliminated.word}</span>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })()}

                {/* Winner announcement — Among Us style */}
                {winnerId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 surface-elevated rounded-[16px] p-5 text-center relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ opacity: [0.05, 0.15, 0.05] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0"
                      style={{
                        background: winnerId === 'VILLAGERS'
                          ? 'radial-gradient(ellipse at center, hsla(142,52%,42%,0.15), transparent 70%)'
                          : 'radial-gradient(ellipse at center, hsla(358,68%,48%,0.15), transparent 70%)'
                      }}
                    />
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4, duration: 0.4 }}
                      className={cn(
                        'relative z-10 text-[9px] font-extrabold uppercase tracking-[0.25em]',
                        winnerId === 'VILLAGERS' ? 'text-success' : 'text-error'
                      )}
                    >
                      {winnerId === 'VILLAGERS' ? 'Victory' : 'Defeat'}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 1.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="relative z-10 text-[24px] font-extrabold tracking-[-0.03em] mt-0.5"
                      style={{ color: winnerId === 'VILLAGERS' ? 'var(--color-success)' : 'var(--color-error)' }}
                    >
                      {winnerId === 'VILLAGERS' ? 'VILLAGERS' : 'ECHO'}
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* ─── RESULTS ─── */}
          {status === 'RESULTS' && (
            <ResultsScreen
              players={players}
              revealedEchoId={revealedEchoId}
              votes={roomState.votes}
              winnerId={winnerId}
              onPlayAgain={actions.playAgain}
              onLeave={actions.leaveRoom}
            />
          )}
        </main>

        {/* ─── Status Bar ─── */}
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 border-t border-border bg-bg-secondary/40 backdrop-blur-xl overflow-x-auto min-w-0 shrink-0">
          {/* Mic / PTT button */}
          {pttMode ? (
            <button
              onMouseDown={startPtt}
              onMouseUp={endPtt}
              onMouseLeave={endPtt}
              onTouchStart={(e) => { e.preventDefault(); startPtt() }}
              onTouchEnd={(e) => { e.preventDefault(); endPtt() }}
              onTouchCancel={endPtt}
              className={cn(
                'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-150 cursor-pointer shrink-0 select-none',
                pttHeld
                  ? 'bg-success/15 text-success shadow-sm shadow-success/20 scale-95'
                  : 'bg-bg-tertiary/30 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              )}
            >
              {pttHeld ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{pttHeld ? 'Speaking' : 'PTT [V]'}</span>
            </button>
          ) : (
            <button
              onClick={toggleLocalMute}
              className={cn(
                'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0',
                isMuted
                  ? 'bg-error/8 text-error/70 hover:bg-error/12'
                  : 'bg-bg-tertiary/30 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              )}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Mic'}</span>
            </button>
          )}

          {/* PTT mode toggle */}
          <button
            onClick={togglePttMode}
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200 cursor-pointer shrink-0',
              pttMode
                ? 'bg-accent/10 text-accent/90 hover:bg-accent/15'
                : 'bg-bg-tertiary/20 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/40'
            )}
            title={pttMode ? 'Switch to Free Hand' : 'Switch to Push to Talk'}
          >
            <span className="font-bold text-[10px] tracking-wider">{pttMode ? 'PTT' : 'FH'}</span>
            <span className="hidden sm:inline">{pttMode ? 'PTT' : 'Free'}</span>
          </button>

          {/* Connection indicator */}
          <div className={cn(
            'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold transition-all duration-200 shrink-0',
            isConnected ? 'bg-bg-tertiary/30 text-text-secondary' : 'bg-error/8 text-error/70'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-success' : 'bg-error')} />
            <span className="hidden sm:inline">{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          {/* Ping indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-bg-tertiary/30 text-text-tertiary text-[11px] font-semibold shrink-0">
            <span className="w-1 h-1 rounded-full bg-text-tertiary/40" />
            <span>Stable</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold text-text-tertiary hover:text-text-primary bg-bg-tertiary/20 hover:bg-bg-tertiary/40 transition-all duration-200 cursor-pointer shrink-0"
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          <div className="flex-1 min-w-[4px]" />

          {/* Room code */}
          {roomState && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-bg-tertiary/30 text-text-tertiary text-[11px] font-mono font-semibold tracking-wider shrink-0">
              {code}
            </div>
          )}

          {/* Leave */}
          <button
            onClick={actions.leaveRoom}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-[10px] text-[11px] font-semibold text-error/60 hover:text-error bg-bg-tertiary/20 hover:bg-error/8 border border-border/30 hover:border-error/20 transition-all duration-200 cursor-pointer shrink-0"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>

        {/* ─── Mobile PTT hold-to-talk button ─── */}
        {pttMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 select-none"
          >
            <button
              onTouchStart={(e) => { e.preventDefault(); startPtt() }}
              onTouchEnd={(e) => { e.preventDefault(); endPtt() }}
              onTouchCancel={endPtt}
              onMouseDown={startPtt}
              onMouseUp={endPtt}
              onMouseLeave={endPtt}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-100 shadow-xl cursor-pointer select-none',
                pttHeld
                  ? 'bg-success scale-90 shadow-success/40'
                  : 'bg-accent scale-100 shadow-accent/20 hover:bg-accent/90'
              )}
            >
              <motion.div
                animate={pttHeld ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {pttHeld ? (
                  <Mic className="w-8 h-8 text-white" />
                ) : (
                  <MicOff className="w-8 h-8 text-white" />
                )}
              </motion.div>
            </button>
            <p className="text-center text-[10px] font-semibold text-text-tertiary mt-2 uppercase tracking-wider">
              {pttHeld ? 'Speaking' : 'Hold to Talk'}
            </p>
          </motion.div>
        )}

        {/* ─── Mobile Chat Sheet ─── */}
        {(status === 'DISCUSSION' || status === 'VOTING') && (
          <>
            <button
              onClick={() => setShowMobileChat(!showMobileChat)}
              className="fixed bottom-20 right-4 z-40 bg-accent text-white p-3 rounded-full shadow-lg sm:hidden cursor-pointer"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showMobileChat && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed inset-x-0 bottom-0 z-50 h-[50vh] bg-bg border-t border-border rounded-t-2xl shadow-2xl sm:hidden flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-[12px] font-semibold text-text-primary">Chat</span>
                    <button onClick={() => setShowMobileChat(false)} className="text-text-tertiary hover:text-text-primary cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {roomState.chatMessages?.map((msg, i) => {
                      const player = players.find(p => p.id === msg.playerId)
                      const color = player ? getPlayerColor(player.id, players.indexOf(player)) : undefined
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[11px] font-semibold shrink-0" style={color ? { color } : {}}>{msg.nickname}:</span>
                          <span className="text-[11px] text-text-secondary">{msg.text}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 p-3 border-t border-border">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value.slice(0, 200))}
                      onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))}
                      placeholder="Chat..."
                      className="flex-1 input-premium !py-2 text-sm"
                    />
                    <button onClick={() => chatInput.trim() && (actions.sendChatMessage(chatInput.trim()), setChatInput(''))} disabled={!chatInput.trim()} className="btn-primary !h-auto !px-4 !py-2 cursor-pointer">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

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

        <CustomWordsModal
          open={showCustomWords}
          onClose={() => setShowCustomWords(false)}
          onSubmit={(pairs) => actions.setCustomWords(pairs)}
          currentPairs={0}
        />
        <Analytics />
      </div>
    </PageTransition>
  )
}
