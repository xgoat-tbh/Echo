import { type Server as SocketIOServer, type Socket } from 'socket.io'
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
  eliminated: boolean
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
    autoReady: boolean
    numEchoes: number
    wordDifficulty: 'easy' | 'normal' | 'hard'
    wordPack: string
    enableVoice: boolean
  }
  currentRound: number
  currentSpeakerIndex: number
  clueOrder: number[]
  wordPair: WordPair | null
  clues: { playerId: string; clue: string }[]
  votes: { voterId: string; targetId: string }[]
  chatMessages: { playerId: string; nickname: string; text: string; timestamp: number }[]
  revealedEchoId: string | null
  winnerId: string | null
  timerInterval: ReturnType<typeof setInterval> | null
  timerValue: number
  echoPlayerIds: string[]
  spectators: string[]
  customWordPairs: WordPair[]
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

function shuffleArray(arr: number[]): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
  const isSpectator = room.spectators.includes(playerId)

  return {
    code: room.code,
    status: room.status,
    settings: room.settings,
    currentRound: room.currentRound,
    currentSpeakerIndex: room.currentSpeakerIndex,
    clueOrder: (room.status === 'CLUE' || room.status === 'DISCUSSION') ? room.clueOrder : [],
    publicWord: room.status !== 'LOBBY' ? room.wordPair?.word ?? null : null,
    echoWord: (isEnded || isSpectator) ? room.wordPair?.echo ?? null : null,
    revealedEchoId: room.revealedEchoId,
    winnerId: room.winnerId,
    timerValue: room.timerValue,
    clues: showClues ? room.clues : [],
    votes: isEnded ? room.votes : [],
    chatMessages: room.chatMessages.slice(-50),
    players: room.players.map(p => {
      const isSelf = p.id === playerId
      return {
        id: p.id,
        nickname: p.nickname,
        isHost: p.isHost,
        isReady: p.isReady,
        word: (isSelf || isEnded) ? p.word : null,
        clue: (p.clue && showClues && !isSpectator) ? p.clue : null,
        hasSpoken: p.hasSpoken,
        hasVoted: p.hasVoted,
        voteTarget: (isSelf || isEnded) ? p.voteTarget : (p.voteTarget ? '__voted__' : null),
        isEcho: (isSelf || isEnded || isSpectator) ? p.isEcho : false,
        isMuted: p.isMuted,
        eliminated: p.eliminated,
      }
    }),
    spectators: room.spectators,
  }
}

function broadcastRoomState(room: GameRoom) {
  const i = getIO()
  room.players.forEach(p => {
    i.to(p.id).emit('room_updated', getFilteredRoomState(room, p.id))
  })
  room.spectators.forEach(sId => {
    i.to(sId).emit('room_updated', getFilteredRoomState(room, sId))
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
    if (room.players.some(p => p.id === socketId) || room.spectators.includes(socketId)) return room
  }
  return null
}

function getActivePlayers(room: GameRoom): Player[] {
  return room.players.filter(p => !p.eliminated)
}

// --- Event Handlers ---

export function handleCreateRoom(socket: Socket, nickname: string) {
  const code = generateRoomCode()
  const player: Player = {
    id: socket.id,
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
    eliminated: false,
  }

  const room: GameRoom = {
    code,
    players: [player],
    status: 'LOBBY',
    settings: {
      maxPlayers: 12,
      clueTimeSeconds: 30,
      discussTimeSeconds: 60,
      voteTimeSeconds: 30,
      autoReady: false,
      numEchoes: 1,
      wordDifficulty: 'normal',
      wordPack: 'mixed',
      enableVoice: true,
    },
    currentRound: 1,
    currentSpeakerIndex: 0,
    clueOrder: [],
    wordPair: null,
    clues: [],
    votes: [],
    chatMessages: [],
    revealedEchoId: null,
    winnerId: null,
    timerInterval: null,
    timerValue: 0,
    echoPlayerIds: [],
    spectators: [],
    customWordPairs: [],
  }

  rooms.set(code, room)
  socket.join(code)
  socket.emit('room_updated', getFilteredRoomState(room, socket.id))
}

export function handleJoinRoom(socket: Socket, code: string, nickname: string) {
  const roomCode = code?.toUpperCase()
  const room = rooms.get(roomCode)

  if (!room) {
    socket.emit('game_error', 'Room not found.')
    return
  }

  if (room.status !== 'LOBBY') {
    socket.emit('game_error', 'Game already started in this room.')
    return
  }

  if (room.players.length >= room.settings.maxPlayers) {
    socket.emit('game_error', 'Room is full.')
    return
  }

  const player: Player = {
    id: socket.id,
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
    eliminated: false,
  }

  room.players.push(player)
  socket.join(roomCode)
  broadcastRoomState(room)
}

export function handleToggleReady(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const player = room.players.find(p => p.id === socketId)
  if (!player || player.eliminated) return
  player.isReady = !player.isReady
  broadcastRoomState(room)
}

function startNewRound(room: GameRoom) {
  const active = getActivePlayers(room)
  if (active.length < 3) {
    // Only 2 or fewer active players left — Echo wins
    room.status = 'REVEAL'
    room.revealedEchoId = null
    room.winnerId = 'ECHO'
    broadcastRoomState(room)
    setTimeout(() => {
      const r = rooms.get(room.code)
      if (!r || r.status !== 'REVEAL') return
      r.status = 'RESULTS'
      broadcastRoomState(r)
    }, 5000)
    return
  }

  const pair = getRandomWordPair(room.settings.wordDifficulty, room.settings.wordPack, room.customWordPairs)
  room.wordPair = pair
  room.status = 'ASSIGNING'
  room.currentRound++

  // Reset per-round state
  active.forEach(p => {
    p.word = null
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

  // Assign words to active players only
  active.forEach((p, i) => {
    p.isEcho = room.echoPlayerIds.includes(p.id)
    p.word = p.isEcho ? pair.echo : pair.word
  })

  // Clue order for active players
  const activeIndices = active.map((_, i) => i)
  let order = shuffleArray(activeIndices)
  const echoIdx = active.findIndex(p => p.isEcho)
  if (echoIdx >= 0) {
    const echoPos = order.indexOf(echoIdx)
    if (echoPos === 0 && order.length > 1) {
      [order[0], order[1]] = [order[1], order[0]]
    }
  }
  room.clueOrder = order

  broadcastRoomState(room)

  setTimeout(() => {
    const r = rooms.get(room.code)
    if (!r || r.status !== 'ASSIGNING') return
    r.status = 'CLUE'
    r.currentSpeakerIndex = 0
    broadcastRoomState(r)
    startClueTimer(r)
  }, 3000)
}

export function handleStartGame(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host) {
    getIO().to(socketId).emit('game_error', 'Only the host can start the game.')
    return
  }

  if (!room.settings.autoReady) {
    const allReady = room.players.every(p => p.isReady)
    if (!allReady) {
      getIO().to(socketId).emit('game_error', 'All players must be ready.')
      return
    }
  }

  const active = room.players
  if (active.length < 4) {
    getIO().to(socketId).emit('game_error', 'Need at least 4 players.')
    return
  }

  // Reset all players
  room.players.forEach(p => {
    p.eliminated = false
    p.isEcho = false
  })

  // Select Echoes
  const numEchoes = Math.min(room.settings.numEchoes, Math.floor(active.length / 2))
  const shuffled = shuffleArray(active.map((_, i) => i))
  const echoIndices = shuffled.slice(0, numEchoes)
  room.echoPlayerIds = echoIndices.map(i => active[i].id)
  echoIndices.forEach(i => { active[i].isEcho = true })

  startNewRound(room)
}

function getCurrentCluePlayer(room: GameRoom): Player | null {
  if (room.currentSpeakerIndex < 0 || room.currentSpeakerIndex >= room.clueOrder.length) return null
  const active = getActivePlayers(room)
  const playerIdx = room.clueOrder[room.currentSpeakerIndex]
  return active[playerIdx] ?? null
}

function startClueTimer(room: GameRoom) {
  const currentPlayer = getCurrentCluePlayer(room)
  if (!currentPlayer || room.status !== 'CLUE') return
  startTimer(room, room.settings.clueTimeSeconds, () => {
    advanceClue(room.code)
  })
}

function advanceClue(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room || room.status !== 'CLUE') return

  let nextIdx = room.currentSpeakerIndex + 1
  while (nextIdx < room.clueOrder.length) {
    const active = getActivePlayers(room)
    const pIdx = room.clueOrder[nextIdx]
    if (active[pIdx] && !active[pIdx].hasSpoken) break
    nextIdx++
  }

  if (nextIdx < room.clueOrder.length) {
    room.currentSpeakerIndex = nextIdx
    broadcastRoomState(room)
    startClueTimer(room)
  } else {
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

  const currentPlayer = getCurrentCluePlayer(room)
  if (!currentPlayer || currentPlayer.id !== socketId) return

  const player = room.players.find(p => p.id === socketId)
  if (!player || player.hasSpoken) return

  player.clue = clue.trim().slice(0, 20)
  player.hasSpoken = true
  room.clues.push({ playerId: socketId, clue: player.clue })

  broadcastRoomState(room)
  clearTimer(room)
  advanceClue(room.code)
}

export function handleSkipDiscussion(socketId: string) {
  const room = findPlayerRoom(socketId)
  if (!room || room.status !== 'DISCUSSION') return
  clearTimer(room)
  transitionToVoting(room.code)
}

function transitionToVoting(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return

  room.status = 'VOTING'
  getActivePlayers(room).forEach(p => { p.voteTarget = null; p.hasVoted = false })
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
  if (!voter || voter.hasVoted || voter.eliminated) return

  const target = room.players.find(p => p.id === targetId)
  if (!target || target.eliminated) return

  voter.voteTarget = targetId
  voter.hasVoted = true
  room.votes.push({ voterId: socketId, targetId })

  broadcastRoomState(room)

  const active = getActivePlayers(room)
  const allVoted = active.every(p => p.hasVoted)
  if (allVoted) {
    clearTimer(room)
    finishVoting(room.code)
  }
}

function finishVoting(roomCode: string) {
  const room = rooms.get(roomCode)
  if (!room) return

  room.status = 'REVEAL'

  const active = getActivePlayers(room)
  const voteCounts: Record<string, number> = {}
  // Only count votes from active players
  room.votes.filter(v => active.some(p => p.id === v.voterId)).forEach(v => {
    voteCounts[v.targetId] = (voteCounts[v.targetId] || 0) + 1
  })

  let maxVotes = 0
  let candidates: string[] = []
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) { maxVotes = count; candidates = [id] }
    else if (count === maxVotes) { candidates.push(id) }
  })

  const eliminatedId = candidates.length > 0 && maxVotes > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null

  if (eliminatedId) {
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId)
    if (eliminatedPlayer) eliminatedPlayer.eliminated = true
    room.revealedEchoId = eliminatedId
  } else {
    room.revealedEchoId = null
  }

  // Check win conditions
  const remainingActive = getActivePlayers(room)
  const remainingEchoes = remainingActive.filter(p => room.echoPlayerIds.includes(p.id))

  if (eliminatedId && room.echoPlayerIds.includes(eliminatedId)) {
    // An Echo was eliminated
    if (remainingEchoes.length === 0) {
      room.winnerId = 'VILLAGERS'
    } else {
      // Echoes still alive, check count
      const remainingCommoners = remainingActive.length - remainingEchoes.length
      if (remainingEchoes.length >= remainingCommoners) {
        room.winnerId = 'ECHO'
      } else {
        // Continue to next round
        broadcastRoomState(room)
        setTimeout(() => {
          const r = rooms.get(room.code)
          if (!r || r.status !== 'REVEAL') return
          startNewRound(r)
        }, 4000)
        return
      }
    }
  } else {
    // Non-Echo eliminated or tie
    if (remainingEchoes.length >= remainingActive.length - remainingEchoes.length) {
      room.winnerId = 'ECHO'
    } else {
      // Continue to next round
      broadcastRoomState(room)
      setTimeout(() => {
        const r = rooms.get(room.code)
        if (!r || r.status !== 'REVEAL') return
        startNewRound(r)
      }, 4000)
      return
    }
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
  room.chatMessages = []
  room.revealedEchoId = null
  room.winnerId = null
  room.currentSpeakerIndex = 0
  room.clueOrder = []
  room.echoPlayerIds = []

  room.players.forEach(p => {
    p.word = null
    p.clue = null
    p.hasSpoken = false
    p.hasVoted = false
    p.voteTarget = null
    p.isReady = p.isHost
    p.isEcho = false
    p.eliminated = false
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

export function handleSetCustomWordPairs(socketId: string, pairs: WordPair[]) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host) return
  if (room.status !== 'LOBBY') return

  room.customWordPairs = pairs.filter(p => p.word?.trim() && p.echo?.trim()).map(p => ({
    word: p.word.trim(),
    echo: p.echo.trim(),
    difficulty: 'normal' as const,
    pack: 'custom',
  }))
  broadcastRoomState(room)
}

export function handleUpdateSettings(socketId: string, settings: Partial<GameRoom['settings']>) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host) return
  if (room.status !== 'LOBBY') return

  Object.assign(room.settings, settings)
  broadcastRoomState(room)
}

export function handleKickPlayer(socketId: string, targetId: string) {
  const room = findPlayerRoom(socketId)
  if (!room) return
  const host = room.players.find(p => p.id === socketId && p.isHost)
  if (!host || host.id === targetId) return
  if (room.status !== 'LOBBY') return

  const target = room.players.findIndex(p => p.id === targetId)
  if (target === -1) return
  room.players.splice(target, 1)
  getIO().to(targetId).emit('kicked')
  getIO().sockets.sockets.get(targetId)?.leave(room.code)
  broadcastRoomState(room)
}

export function handleChatMessage(socketId: string, text: string) {
  const room = findPlayerRoom(socketId)
  if (!room || (room.status !== 'DISCUSSION' && room.status !== 'VOTING')) return

  const player = room.players.find(p => p.id === socketId)
  if (!player || player.eliminated) return

  const msg = text.trim().slice(0, 200)
  if (!msg) return

  room.chatMessages.push({ playerId: socketId, nickname: player.nickname, text: msg, timestamp: Date.now() })
  broadcastRoomState(room)
}

export function handleListRooms(): { code: string; playerCount: number; maxPlayers: number; status: string }[] {
  const list: { code: string; playerCount: number; maxPlayers: number; status: string }[] = []
  for (const room of rooms.values()) {
    if (room.status === 'LOBBY' || room.status === 'ASSIGNING' || room.status === 'CLUE') {
      list.push({
        code: room.code,
        playerCount: room.players.filter(p => !p.eliminated).length,
        maxPlayers: room.settings.maxPlayers,
        status: room.status,
      })
    }
  }
  return list
}

export function handleJoinAsSpectator(socket: Socket, code: string) {
  const roomCode = code?.toUpperCase()
  const room = rooms.get(roomCode)
  if (!room) {
    socket.emit('game_error', 'Room not found.')
    return
  }

  room.spectators.push(socket.id)
  socket.join(roomCode)
  socket.emit('room_updated', getFilteredRoomState(room, socket.id))
}

export function handleLeaveRoom(socketId: string) {
  handleDisconnect(socketId)
}

const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function handleReconnect(socket: Socket, code: string, nickname: string) {
  const roomCode = code?.toUpperCase()
  const room = rooms.get(roomCode)
  if (!room) {
    socket.emit('game_error', 'Room not found.')
    return
  }

  // Cancel pending disconnect
  const timerKey = `${roomCode}_${nickname}`
  const existingTimer = disconnectTimers.get(timerKey)
  if (existingTimer) {
    clearTimeout(existingTimer)
    disconnectTimers.delete(timerKey)
  }

  // Find the disconnected player by nickname
  const existing = room.players.find(p => p.nickname === nickname)
  if (existing) {
    existing.id = socket.id
    socket.join(roomCode)
    socket.emit('room_updated', getFilteredRoomState(room, socket.id))
    broadcastRoomState(room)
    return
  }

  // Not found — treat as fresh join
  if (room.status === 'LOBBY') {
    handleJoinRoom(socket, code, nickname)
  } else {
    socket.emit('game_error', 'Game in progress. Could not reconnect.')
  }
}

export function handleDisconnect(socketId: string) {
  for (const [code, room] of rooms.entries()) {
    const specIdx = room.spectators.indexOf(socketId)
    if (specIdx >= 0) {
      room.spectators.splice(specIdx, 1)
    }

    const pIndex = room.players.findIndex(p => p.id === socketId)
    if (pIndex === -1) {
      if (specIdx >= 0 && room.players.every(p => p.eliminated) && room.spectators.length === 0) {
        clearTimer(room)
        rooms.delete(code)
      }
      continue
    }

    const player = room.players[pIndex]
    const wasActive = !player.eliminated

    // Give 20s grace period for reconnect
    const timerKey = `${code}_${player.nickname}`
    const timer = setTimeout(() => {
      room.players.splice(pIndex, 1)
      disconnectTimers.delete(timerKey)

      if (room.players.every(p => p.eliminated) && room.spectators.length === 0) {
        clearTimer(room)
        rooms.delete(code)
      } else {
        if (player.isHost) {
          const nextHost = room.players.find(p => !p.eliminated) || room.players[0]
          nextHost.isHost = true
          nextHost.isReady = true
        }
        if (room.status === 'CLUE' && wasActive && room.clueOrder.length > 0) {
          const active = getActivePlayers(room)
          const cluePos = room.clueOrder.indexOf(pIndex)
          if (cluePos >= 0) {
            room.clueOrder.splice(cluePos, 1)
            room.clueOrder = room.clueOrder.map(idx => idx > pIndex ? idx - 1 : idx)
          }
          if (room.currentSpeakerIndex >= room.clueOrder.length) {
            room.currentSpeakerIndex = Math.max(0, room.clueOrder.length - 1)
          }
          broadcastRoomState(room)
        } else {
          broadcastRoomState(room)
        }
      }
    }, 20000)

    disconnectTimers.set(timerKey, timer)
    break
  }
}
