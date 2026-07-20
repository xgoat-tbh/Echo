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
  eliminated: boolean
}

export interface RoomState {
  code: string
  status: GamePhase
  settings: {
    maxPlayers: number
    clueTimeSeconds: number
    discussTimeSeconds: number
    voteTimeSeconds: number
    autoReady: boolean
    numEchoes: number
    wordDifficulty: 'easy' | 'normal' | 'hard'
    wordPack: string
    enableVoice: boolean
  }
  currentRound: number
  currentSpeakerIndex: number
  clueOrder: number[]
  publicWord: string | null
  echoWord: string | null
  revealedEchoId: string | null
  winnerId: string | null
  timerValue: number
  clues: { playerId: string; clue: string }[]
  votes: { voterId: string; targetId: string }[]
  chatMessages: { playerId: string; nickname: string; text: string; timestamp: number }[]
  spectators: string[]
  players: Player[]
}

export function useSocket() {
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const [voiceOffer, setVoiceOffer] = useState<{ senderId: string; offer: any } | null>(null)
  const [voiceAnswer, setVoiceAnswer] = useState<{ senderId: string; answer: any } | null>(null)
  const [iceCandidate, setIceCandidate] = useState<{ senderId: string; candidate: any } | null>(null)
  const roomListRef = useRef<any[]>([])

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_WS_URL?.replace(/^ws/, 'http') || window.location.origin

    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      timeout: 30000,
      withCredentials: false,
    })
    ;(window as any).__socketUrl = serverUrl
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectError(null)
      setError(null)
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      setRoomState(null)
      setVoiceOffer(null)
      setVoiceAnswer(null)
      setIceCandidate(null)
      if (reason !== 'io client disconnect') {
        setConnectError(`Disconnected: ${reason}`)
      }
    })

    socket.on('connect_error', (err) => {
      const msg = err.message || 'unknown error'
      const url = (window as any).__socketUrl || 'unknown'
      setConnectError(`Connection failed (target: ${url}): ${msg}`)
    })

    socket.on('room_updated', (state: RoomState) => {
      setRoomState(state)
      setError(null)
      setConnectError(null)
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

    socket.on('kicked', () => {
      setRoomState(null)
      socket.disconnect()
    })

    socket.on('room_list', (rooms: any[]) => {
      roomListRef.current = rooms
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const createRoom = useCallback((nickname: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('create_room', nickname)
    }
  }, [])

  const joinRoom = useCallback((code: string, nickname: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { code, nickname })
    }
  }, [])

  const toggleReady = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('toggle_ready')
    }
  }, [])

  const startGame = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('start_game')
    }
  }, [])

  const submitClue = useCallback((clue: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('submit_clue', { clue })
    }
  }, [])

  const skipDiscussion = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('skip_discussion')
    }
  }, [])

  const castVote = useCallback((targetId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cast_vote', { targetId })
    }
  }, [])

  const playAgain = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('play_again')
    }
  }, [])

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room')
      socketRef.current.disconnect()
    }
  }, [])

  const toggleMute = useCallback((isMuted: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('toggle_mute', isMuted)
    }
  }, [])

  const relayVoiceOffer = useCallback((targetId: string, offer: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('voice_offer', { targetId, offer })
    }
  }, [])

  const relayVoiceAnswer = useCallback((targetId: string, answer: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('voice_answer', { targetId, answer })
    }
  }, [])

  const relayIceCandidate = useCallback((targetId: string, candidate: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ice_candidate', { targetId, candidate })
    }
  }, [])

  const updateSettings = useCallback((settings: Partial<RoomState['settings']>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_settings', settings)
    }
  }, [])

  const kickPlayer = useCallback((targetId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('kick_player', { targetId })
    }
  }, [])

  const sendChatMessage = useCallback((text: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat_message', { text })
    }
  }, [])

  const joinAsSpectator = useCallback((code: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_as_spectator', { code })
    }
  }, [])

  const listRooms = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('list_rooms')
    }
  }, [])

  const reconnect = useCallback((code: string, nickname: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('reconnect', { code, nickname })
    }
  }, [])

  const setCustomWords = useCallback((pairs: { word: string; echo: string }[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('set_custom_words', { pairs })
    }
  }, [])

  return {
    socket: socketRef.current,
    roomState,
    error,
    isConnected,
    connectError,
    voiceOffer,
    voiceAnswer,
    iceCandidate,
    actions: {
      createRoom,
      joinRoom,
      toggleReady,
      startGame,
      submitClue,
      skipDiscussion,
      castVote,
      playAgain,
      leaveRoom,
      toggleMute,
      relayVoiceOffer,
      relayVoiceAnswer,
      relayIceCandidate,
      updateSettings,
      kickPlayer,
      sendChatMessage,
      joinAsSpectator,
      listRooms,
      reconnect,
      setCustomWords,
    },
    roomList: roomListRef.current,
  }
}
