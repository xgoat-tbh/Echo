import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
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
  handleCastVote,
  handlePlayAgain,
  handleToggleMute,
  handleDisconnect,
} from './game.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())

const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))
// SPA fallback — must match any non-API path
app.use((req, res, next) => {
  if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next()
  })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
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

  socket.on('submit_clue', ({ clue }) => {
    handleSubmitClue(socket.id, clue)
  })

  socket.on('cast_vote', ({ targetId }) => {
    handleCastVote(socket.id, targetId)
  })

  socket.on('play_again', () => {
    handlePlayAgain(socket.id)
  })

  socket.on('toggle_mute', (isMuted) => {
    handleToggleMute(socket.id, isMuted)
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
