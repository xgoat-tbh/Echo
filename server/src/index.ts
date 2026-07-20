import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import https from 'https'
import http from 'http'

import {
  setIO,
  handleCreateRoom,
  handleJoinRoom,
  handleToggleReady,
  handleStartGame,
  handleSubmitClue,
  handleSkipDiscussion,
  handleCastVote,
  handlePlayAgain,
  handleToggleMute,
  handleUpdateSettings,
  handleSetCustomWordPairs,
  handleKickPlayer,
  handleChatMessage,
  handleJoinAsSpectator,
  handleListRooms,
  handleReconnect,
  handleLeaveRoom,
  handleDisconnect,
} from './game.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:4173']
app.use(cors({ origin: allowedOrigins, credentials: true }))

// Serve client static files if they exist (for single-server deploys)
const distPath = path.join(__dirname, '../../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next()
    })
  })
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), url: _req.headers.host })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
})

setIO(io)

function startKeepAlive() {
  const url = process.env.RENDER_EXTERNAL_URL
  if (!url) return
  setInterval(() => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      console.log(`Keep-alive ping. Status: ${res.statusCode}`)
    }).on('error', (err) => {
      console.error(`Keep-alive failed: ${err.message}`)
    })
  }, 10 * 60 * 1000)
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} from ${socket.handshake.address}`)
  socket.on('create_room', (nickname) => {
    handleCreateRoom(socket, nickname)
  })

  socket.on('join_room', ({ code, nickname }) => {
    handleJoinRoom(socket, code, nickname)
  })

  socket.on('toggle_ready', () => {
    handleToggleReady(socket.id)
  })

  socket.on('start_game', () => {
    handleStartGame(socket.id)
  })

  socket.on('skip_discussion', () => {
    handleSkipDiscussion(socket.id)
  })

  socket.on('submit_clue', ({ clue }) => {
    handleSubmitClue(socket.id, clue)
  })

  socket.on('cast_vote', ({ targetId }) => {
    handleCastVote(socket.id, targetId)
  })

  socket.on('play_again', () => {
    handlePlayAgain(socket.id)
  })

  socket.on('leave_room', () => {
    handleLeaveRoom(socket.id)
  })

  socket.on('toggle_mute', (isMuted) => {
    handleToggleMute(socket.id, isMuted)
  })

  socket.on('update_settings', (settings) => {
    handleUpdateSettings(socket.id, settings)
  })

  socket.on('set_custom_words', ({ pairs }) => {
    handleSetCustomWordPairs(socket.id, pairs)
  })

  socket.on('kick_player', ({ targetId }) => {
    handleKickPlayer(socket.id, targetId)
  })

  socket.on('chat_message', ({ text }) => {
    handleChatMessage(socket.id, text)
  })

  socket.on('join_as_spectator', ({ code }) => {
    handleJoinAsSpectator(socket, code)
  })

  socket.on('list_rooms', () => {
    const rooms = handleListRooms()
    socket.emit('room_list', rooms)
  })

  socket.on('reconnect', ({ code, nickname }) => {
    handleReconnect(socket, code, nickname)
  })

  // Voice P2P signaling relay
  socket.on('voice_offer', ({ targetId, offer }) => {
    io.to(targetId).emit('voice_offer', { senderId: socket.id, offer })
  })

  socket.on('voice_answer', ({ targetId, answer }) => {
    io.to(targetId).emit('voice_answer', { senderId: socket.id, answer })
  })

  socket.on('ice_candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice_candidate', { senderId: socket.id, candidate })
  })

  socket.on('disconnect', () => {
    handleDisconnect(socket.id)
  })
})

const PORT = parseInt(process.env.PORT || '4000', 10)
httpServer.listen(PORT, () => {
  console.log(`Echo server running on port ${PORT}`)
  startKeepAlive()
})
