import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export type GamePhase = 'LOBBY' | 'ASSIGNING' | 'CLUE' | 'DISCUSSION' | 'VOTING' | 'REVEAL' | 'RESULTS'

export interface Player {
  id: string
  nickname: string
  isHost: boolean
  isReady: boolean
  word: string | null
  clue: string | null
  hasSpoken: boolean
  hasVoted: boolean
  voteTarget: string | null
  isEcho: boolean
  isMuted: boolean
}

export interface RoomState {
  code: string
  status: GamePhase
  settings: {
    maxPlayers: number
    clueTimeSeconds: number
    discussTimeSeconds: number
    voteTimeSeconds: number
  }
  currentRound: number
  currentSpeakerIndex: number
  publicWord: string | null
  echoWord: string | null
  revealedEchoId: string | null
  winnerId: string | null
  timerValue: number
  clues: { playerId: string; clue: string }[]
  votes: { voterId: string; targetId: string }[]
  players: Player[]
}

export function useSocket() {
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Voice P2P signaling state
  const [voiceOffer, setVoiceOffer] = useState<{ senderId: string; offer: any } | null>(null)
  const [voiceAnswer, setVoiceAnswer] = useState<{ senderId: string; answer: any } | null>(null)
  const [iceCandidate, setIceCandidate] = useState<{ senderId: string; candidate: any } | null>(null)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const isDev = import.meta.env.DEV
    const serverUrl = isDev
      ? 'http://localhost:4000'
      : (import.meta.env.VITE_BACKEND_URL || window.location.origin)

    const socket = io(serverUrl)
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setRoomState(null)
      setVoiceOffer(null)
      setVoiceAnswer(null)
      setIceCandidate(null)
    })

    socket.on('room_updated', (state: RoomState) => {
      setRoomState(state)
      setError(null)
    })

    socket.on('game_error', (msg: string) => {
      setError(msg)
      setTimeout(() => setError(null), 4000)
    })

    socket.on('voice_offer', ({ senderId, offer }) => {
      setVoiceOffer({ senderId, offer })
    })

    socket.on('voice_answer', ({ senderId, answer }) => {
      setVoiceAnswer({ senderId, answer })
    })

    socket.on('ice_candidate', ({ senderId, candidate }) => {
      setIceCandidate({ senderId, candidate })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const createRoom = useCallback((nickname: string) => {
    if (socketRef.current) {
      socketRef.current.emit('create_room', nickname)
    }
  }, [])

  const joinRoom = useCallback((code: string, nickname: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', { code, nickname })
    }
  }, [])

  const toggleReady = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_ready')
    }
  }, [])

  const startGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('start_game')
    }
  }, [])

  const submitClue = useCallback((clue: string) => {
    if (socketRef.current) {
      socketRef.current.emit('submit_clue', { clue })
    }
  }, [])

  const castVote = useCallback((targetId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('cast_vote', { targetId })
    }
  }, [])

  const playAgain = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('play_again')
    }
  }, [])

  const toggleMute = useCallback((isMuted: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_mute', isMuted)
    }
  }, [])

  // Voice P2P relays
  const relayVoiceOffer = useCallback((targetId: string, offer: any) => {
    if (socketRef.current) {
      socketRef.current.emit('voice_offer', { targetId, offer })
    }
  }, [])

  const relayVoiceAnswer = useCallback((targetId: string, answer: any) => {
    if (socketRef.current) {
      socketRef.current.emit('voice_answer', { targetId, answer })
    }
  }, [])

  const relayIceCandidate = useCallback((targetId: string, candidate: any) => {
    if (socketRef.current) {
      socketRef.current.emit('ice_candidate', { targetId, candidate })
    }
  }, [])

  return {
    socket: socketRef.current,
    roomState,
    error,
    isConnected,
    voiceOffer,
    voiceAnswer,
    iceCandidate,
    actions: {
      createRoom,
      joinRoom,
      toggleReady,
      startGame,
      submitClue,
      castVote,
      playAgain,
      toggleMute,
      relayVoiceOffer,
      relayVoiceAnswer,
      relayIceCandidate,
    },
  }
}
