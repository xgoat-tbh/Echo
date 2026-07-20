import uWS from 'uWebSockets.js'
import type * as mediasoup from 'mediasoup'
import { Room } from './Room.js'
import { SignalMessage, SignalMessageType } from './protocol.js'
import { v4 as uuidv4 } from 'uuid'

interface PeerConnection {
  ws: uWS.WebSocket
  userId: string
  username: string
  roomId: string | null
}

export function createApp(getWorker: () => mediasoup.types.Worker) {
  const rooms = new Map<string, Room>()
  const connections = new Map<string, PeerConnection>()

  const getOrCreateRoom = async (worker: mediasoup.types.Worker): Promise<Room> => {
    // Find existing room with space, or create new
    for (const [, room] of rooms) {
      if (room.peerCount < 16) return room
    }

    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          parameters: {
            spropStereo: 1,
            maxplaybackrate: 48000,
            usedtx: 1,
            stereo: 1,
          },
        },
      ],
    })

    const room = new Room(router, (roomId, message) => {
      const target = message._target as string | undefined
      const exclude = message._exclude as string | undefined

      for (const [, conn] of connections) {
        if (conn.roomId !== roomId) continue
        if (target && conn.userId !== target) continue
        if (exclude && conn.userId === exclude) continue

        try {
          const { _target, _exclude, ...clean } = message
          conn.ws.send(JSON.stringify(clean), true)
        } catch {
          // Connection closed
        }
      }
    })

    rooms.set(room.id, room)
    return room
  }

  const app = uWS
    .App()
    .ws('/*', {
      compression: 0,
      maxPayloadLength: 16 * 1024,
      idleTimeout: 120,

      open: (ws) => {
        // Will be associated on ROOM_JOIN
      },

      message: async (ws, arrayBuffer, isLast) => {
        try {
          const ab = arrayBuffer
          const buf = Buffer.from(ab.slice(0, ab.byteLength))
          const msg: SignalMessage = JSON.parse(buf.toString())

          const conn = Array.from(connections.values()).find(
            (c) => c.ws === ws
          )

          switch (msg.type) {
            case SignalMessageType.ROOM_CREATE: {
              const worker = getWorker()
              const room = await getOrCreateRoom(worker)
              const userId = uuidv4().slice(0, 8)
              const username = (msg.payload.username as string) || `User_${userId}`

              connections.set(userId, { ws, userId, username, roomId: room.id })
              room.addPeer(userId, username)

              ws.send(JSON.stringify({
                type: SignalMessageType.ROOM_CREATE,
                roomId: room.id,
                senderId: 'server',
                payload: { roomId: room.id, userId, ...room.getState() },
                timestamp: Date.now(),
                id: uuidv4(),
              }), true)
              break
            }

            case SignalMessageType.ROOM_JOIN: {
              const roomCode = msg.payload.roomId as string
              let room = rooms.get(roomCode)

              if (!room) {
                const worker = getWorker()
                room = await getOrCreateRoom(worker)
              }

              const userId = uuidv4().slice(0, 8)
              const username = (msg.payload.username as string) || `User_${userId}`

              connections.set(userId, { ws, userId, username, roomId: room.id })
              room.addPeer(userId, username)

              ws.send(JSON.stringify({
                type: SignalMessageType.ROOM_STATE,
                roomId: room.id,
                senderId: 'server',
                payload: { userId, ...room.getState() },
                timestamp: Date.now(),
                id: uuidv4(),
              }), true)
              break
            }

            case SignalMessageType.TRANSPORT_CREATE: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              if (!room) return

              const transportOptions = await room.createTransport(conn.userId)
              ws.send(JSON.stringify({
                type: SignalMessageType.TRANSPORT_CREATE,
                roomId: conn.roomId,
                senderId: 'server',
                payload: transportOptions,
                timestamp: Date.now(),
                id: msg.id,
              }), true)
              break
            }

            case SignalMessageType.TRANSPORT_CONNECT: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              if (!room) return

              await room.connectTransport(
                conn.userId,
                msg.payload.dtlsParameters as any
              )
              ws.send(JSON.stringify({
                type: SignalMessageType.TRANSPORT_CONNECT,
                roomId: conn.roomId,
                senderId: 'server',
                payload: { ok: true },
                timestamp: Date.now(),
                id: msg.id,
              }), true)
              break
            }

            case SignalMessageType.PRODUCE: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              if (!room) return

              const producerId = await room.produce(
                conn.userId,
                msg.payload.kind as any,
                msg.payload.rtpParameters as any
              )
              ws.send(JSON.stringify({
                type: SignalMessageType.PRODUCE,
                roomId: conn.roomId,
                senderId: 'server',
                payload: { id: producerId },
                timestamp: Date.now(),
                id: msg.id,
              }), true)
              break
            }

            case SignalMessageType.ROOM_LEAVE: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              room?.removePeer(conn.userId)
              connections.delete(conn.userId)

              if (room && room.peerCount === 0) {
                rooms.delete(room.id)
              }
              break
            }

            case SignalMessageType.PEER_SPEAKING: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              room?.broadcast({
                type: SignalMessageType.PEER_SPEAKING,
                roomId: conn.roomId,
                senderId: 'server',
                payload: {
                  userId: conn.userId,
                  speaking: msg.payload.speaking,
                  level: msg.payload.level,
                },
                timestamp: Date.now(),
                id: uuidv4(),
              }, conn.userId)
              break
            }

            case SignalMessageType.PEER_MUTED: {
              if (!conn?.roomId) return
              const room = rooms.get(conn.roomId)
              room?.broadcast({
                type: SignalMessageType.PEER_MUTED,
                roomId: conn.roomId,
                senderId: 'server',
                payload: {
                  userId: conn.userId,
                  muted: msg.payload.muted,
                },
                timestamp: Date.now(),
                id: uuidv4(),
              }, conn.userId)
              break
            }
          }
        } catch (err) {
          console.error('Message handler error:', err)
        }
      },

      close: (ws) => {
        const conn = Array.from(connections.values()).find(
          (c) => c.ws === ws
        )
        if (conn?.roomId) {
          const room = rooms.get(conn.roomId)
          room?.removePeer(conn.userId)
          connections.delete(conn.userId)

          if (room && room.peerCount === 0) {
            rooms.delete(room.id)
          }
        }
      },
    })
    .get('/api/health', (res) => {
      res.writeHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        status: 'ok',
        rooms: rooms.size,
        connections: connections.size,
      }))
    })

  return app
}
