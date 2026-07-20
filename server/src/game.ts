import { type Server as SocketIOServer } from 'socket.io'
import { getRandomWordPair, type WordPair } from './words.js'

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

export interface GameRoom {
  code: string
  players: Player[]
  status: GamePhase
  settings: {
    maxPlayers: number
    clueTimeSeconds: number
    discussTimeSeconds: number
    voteTimeSeconds: number
  }
  currentRound: number
  currentSpeakerIndex: number
  wordPair: WordPair | null
  clues: { playerId: string; clue: string }[]
  votes: { voterId: string; targetId: string }[]
  revealedEchoId: string | null
  winnerId: string | null
  timerInterval: ReturnType<typeof setInterval> | null
  timerValue: number
}

export const rooms = new Map<string, GameRoom>()
let io: SocketIOServer | null = null

export function setIO(instance: SocketIOServer) {
  io = instance
}

function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  if (rooms.has(code)) return generateRoomCode()
  return code
}

export function getFilteredRoomState(room: GameRoom, playerId: string) {
  const isEnded = room.status === 'REVEAL' || room.status === 'RESULTS'
  const showClues = room.status !== 'LOBBY' && room.status !== 'ASSIGNING'

  return {
    code: room.code,
    status: room.status,
    settings: room.settings,
    currentRound: room.currentRound,
    currentSpeakerIndex: room.currentSpeakerIndex,
    publicWord: room.status !== 'LOBBY' ? room.wordPair?.word ?? null : null,
    echoWord: isEnded ? room.wordPair?.echo ?? null : null,
    revealedEchoId: room.revealedEchoId,
    winnerId: room.winnerId,
    timerValue: room.timerValue,
    clues: showClues ? room.clues : [],
    votes: isEnded ? room.votes : [],
    players: room.players.map(p => {
      const isSelf = p.id === playerId
      return {
        id: p.id,
        nickname: p.nickname,
        isHost: p.isHost,
        isReady: p.isReady,
        word: (isSelf || isEnded) ? p.word : null,
        clue: (p.clue && showClues) ? p.clue : null,
        hasSpoken: p.hasSpoken,
        hasVoted: p.hasVoted,
        voteTarget: (isSelf || isEnded) ? p.voteTarget : (p.voteTarget ? '__voted__' : null),
        isEcho: (isSelf || isEnded) ? p.isEcho : false,
        isMuted: p.isMuted,
      }
    }),
  }
}

function broadcastRoomState(room: GameRoom) {
  const i = getIO()
  room.players.forEach(p => {
    i.to(p.id).emit('room_updated', getFilteredRoomState(room, p.id))
  })
}

function clearTimer(room: GameRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval)
    room.timerInterval = null
  }
}

function startTimer(room: GameRoom, seconds: number, onEnd: () => void) {
  clearTimer(room)
  room.timerValue = seconds
  if (seconds <= 0) {
    onEnd()
    return
  }
  room.timerInterval = setInterval(() => {
    const r = rooms.get(room.code)
    if (!r) { clearTimer(room); return }
    r.timerValue--
    broadcastRoomState(r)
    if (r.timerValue <= 0) {
      clearTimer(r)
      onEnd()
    }
  }, 1000)
}

function findPlayerRoom(socketId: string): GameRoom | null {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === socketId)) return room
  }
  return null
}

// --- Event Handlers ---

export function handleCreateRoom(socketId: string, nickname: string) {
  const code = generateRoomCode()
  const player: Player = {
    id: socketId,
    nickname: nickname || `Player${Math.floor(Math.random() * 1000)}`,
    isHost: true,
    isReady: true,
    word: null,
    clue: null,
    hasSpoken: false,
    hasVoted: false,
    voteTarget: null,
    isEcho: false,
    isMuted: false,
  }

  const room: GameRoom = {
    code,
    players: [player],
    status: 'LOBBY',
    settings: {
      maxPlayers: 12,
      clueTimeSeconds: 30,
      discussTimeSeconds: 120,
      voteTimeSeconds: 30,
    },
    currentRound: 1,
    currentSpeakerIndex: 0,
    wordPair: null,
    clues: [],
    votes: [],
    revealedEchoId: null,
    winnerId: null,
    timerInterval: null,
    timerValue: 0,
  }

  rooms.set(code, room)
  const i = getIO()
  i.in(socketId).socketsJoin(code)
  i.to(socketId).emit('room_updated', getFilteredRoomState(room, socketId))
}

export function handleJoinRoom(socketId: string, code: string, nickname: string) {
  const roomCode = code?.toUpperCase()
  const room = rooms.get(roomCode)

  if (!room) {
    getIO().to(socketId).emit('game_error', 'Room not found.')
    return
  }

  if (room.status !== 'LOBBY') {
    getIO().to(socketId).emit('game_error', 'Game already started in this room.')
    return
  }

  if (room.players.length >= room.settings.maxPlayers) {
    getIO().to(socketId).emit('game_error', 'Room is full.')
    return
  }

  const player: Player = {
    id: socketId,
    nickname: nickname || `Player${Math.floor(Math.random() * 1000)}`,
    isHost: false,
    isReady: false,
    word: null,
    clue: null,
    hasSpoken: false,
    hasVoted: false,
    voteTarget: null,
    isEcho: false,
    isMuted: false,
  }

  room.players.push(player)
  const i = getIO()
  i.in(socketId).socketsJoin(roomCode)
  broadcastRoomState(room)
}

export function handleToggleReady(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const player = room.players.find(p => p.id === socketId)
  if (!player) return
  player.isReady = !player.isReady
  broadcastRoomState(room)
}

export function handleStartGame(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host) {
    getIO().to(socketId).emit('game_error', 'Only the host can start the game.')
    return
  }

  const allReady = room.players.every(p => p.isReady)
  if (!allReady) {
    getIO().to(socketId).emit('game_error', 'All players must be ready.')
    return
  }

  if (room.players.length < 4) {
    getIO().to(socketId).emit('game_error', 'Need at least 4 players.')
    return
  }

  // Assign words
  const pair = getRandomWordPair()
  room.wordPair = pair
  room.status = 'ASSIGNING'

  // Pick random Echo
  const echoIndex = Math.floor(Math.random() * room.players.length)

  room.players.forEach((p, i) => {
    p.isEcho = i === echoIndex
    p.word = i === echoIndex ? pair.echo : pair.word
    p.clue = null
    p.hasSpoken = false
    p.hasVoted = false
    p.voteTarget = null
  })

  room.clues = []
  room.votes = []
  room.currentSpeakerIndex = 0
  room.revealedEchoId = null
  room.winnerId = null

  broadcastRoomState(room)

  // Brief assign phase, then auto-advance to clue
  setTimeout(() => {
    const r = rooms.get(room.code)
    if (!r || r.status !== 'ASSIGNING') return
    r.status = 'CLUE'
    r.currentSpeakerIndex = 0
    broadcastRoomState(r)
    startClueTimer(r)
  }, 3000)
}

function startClueTimer(room: GameRoom) {
  const currentPlayer = room.players[room.currentSpeakerIndex]
  if (!currentPlayer || room.status !== 'CLUE') return
  startTimer(room, room.settings.clueTimeSeconds, () => {
    advanceClue(room.code)
  })
}

function advanceClue(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room || room.status !== 'CLUE') return

  // Find next player who hasn't spoken
  let nextIndex = room.currentSpeakerIndex + 1
  while (nextIndex < room.players.length) {
    if (!room.players[nextIndex].hasSpoken) break
    nextIndex++
  }

  if (nextIndex < room.players.length) {
    room.currentSpeakerIndex = nextIndex
    broadcastRoomState(room)
    startClueTimer(room)
  } else {
    // All players have spoken, transition to discussion
    room.status = 'DISCUSSION'
    room.currentSpeakerIndex = -1
    broadcastRoomState(room)
    startTimer(room, room.settings.discussTimeSeconds, () => {
      transitionToVoting(roomCode)
    })
  }
}

export function handleSubmitClue(socketId: string, clue: string) {
  const room = findPlayerRoom(socketId)
  if (!room || room.status !== 'CLUE') return

  const playerIndex = room.players.findIndex(p => p.id === socketId)
  if (playerIndex !== room.currentSpeakerIndex) return

  const player = room.players[playerIndex]
  if (!player || player.hasSpoken) return

  player.clue = clue.trim().slice(0, 20)
  player.hasSpoken = true
  room.clues.push({ playerId: socketId, clue: player.clue })

  broadcastRoomState(room)
  clearTimer(room)
  advanceClue(room.code)
}

function transitionToVoting(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return

  room.status = 'VOTING'
  room.players.forEach(p => { p.voteTarget = null; p.hasVoted = false })
  room.votes = []
  broadcastRoomState(room)

  startTimer(room, room.settings.voteTimeSeconds, () => {
    finishVoting(roomCode)
  })
}

export function handleCastVote(socketId: string, targetId: string) {
  const room = findPlayerRoom(socketId)
  if (!room || room.status !== 'VOTING') return

  const voter = room.players.find(p => p.id === socketId)
  if (!voter || voter.hasVoted) return

  const target = room.players.find(p => p.id === targetId)
  if (!target) return

  voter.voteTarget = targetId
  voter.hasVoted = true
  room.votes.push({ voterId: socketId, targetId })

  broadcastRoomState(room)

  const allVoted = room.players.every(p => p.hasVoted)
  if (allVoted) {
    clearTimer(room)
    finishVoting(room.code)
  }
}

function finishVoting(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return

  room.status = 'REVEAL'

  // Tally votes
  const voteCounts: Record<string, number> = {}
  room.votes.forEach(v => {
    voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1
  })

  let maxVotes = 0
  let candidates: string[] = []
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) { maxVotes = count; candidates = [id] }
    else if (count === maxVotes) { candidates.push(id) }
  })

  // If tie, pick random
  const eliminatedId = candidates.length > 0 && maxVotes > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null

  room.revealedEchoId = eliminatedId

  // Determine winner
  if (eliminatedId) {
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId)
    if (eliminatedPlayer?.isEcho) {
      // Echo was voted out — non-Echo players win
      room.winnerId = 'VILLAGERS'
    } else {
      // Wrong player voted out — Echo wins
      room.winnerId = eliminatedPlayer ? 'ECHO' : 'VILLAGERS'
    }
  } else {
    // No votes — Echo wins by default
    room.winnerId = 'ECHO'
  }

  broadcastRoomState(room)

  setTimeout(() => {
    const r = rooms.get(room.code)
    if (!r || r.status !== 'REVEAL') return
    r.status = 'RESULTS'
    broadcastRoomState(r)
  }, 5000)
}

export function handlePlayAgain(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host) return
  if (room.status !== 'RESULTS') return

  clearTimer(room)
  room.status = 'LOBBY'
  room.currentRound = 1
  room.wordPair = null
  room.clues = []
  room.votes = []
  room.revealedEchoId = null
  room.winnerId = null
  room.currentSpeakerIndex = 0

  room.players.forEach(p => {
    p.word = null
    p.clue = null
    p.hasSpoken = false
    p.hasVoted = false
    p.voteTarget = null
    p.isEcho = false
    p.isReady = p.isHost
  })

  broadcastRoomState(room)
}

export function handleToggleMute(socketId: string, isMuted: boolean) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const player = room.players.find(p => p.id === socketId)
  if (!player) return
  player.isMuted = isMuted
  broadcastRoomState(room)
}

export function handleDisconnect(socketId: string) {
  for (const [code, room] of rooms.entries()) {
    const pIndex = room.players.findIndex(p => p.id === socketId)
    if (pIndex === -1) continue

    const player = room.players[pIndex]
    room.players.splice(pIndex, 1)

    if (room.players.length === 0) {
      clearTimer(room)
      rooms.delete(code)
    } else {
      if (player.isHost) {
        room.players[0].isHost = true
        room.players[0].isReady = true
      }

      // Adjust currentSpeakerIndex
      if (room.status === 'CLUE') {
        if (pIndex <= room.currentSpeakerIndex) {
          room.currentSpeakerIndex = Math.max(0, room.currentSpeakerIndex - 1)
        }
        if (room.currentSpeakerIndex >= room.players.length) {
          room.currentSpeakerIndex = 0
        }
      }

      broadcastRoomState(room)
    }
    break
  }
}
