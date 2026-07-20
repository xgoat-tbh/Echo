import type * as mediasoup from 'mediasoup'
import { v4 as uuidv4 } from 'uuid'

interface Peer {
  id: string
  username: string
  transport: mediasoup.types.WebRtcTransport | null
  producer: mediasoup.types.Producer | null
  consumers: Map<string, mediasoup.types.Consumer>
}

export class Room {
  id: string
  private router: mediasoup.types.Router
  private peers: Map<string, Peer> = new Map()
  private onBroadcast: (roomId: string, message: any) => void

  constructor(router: mediasoup.types.Router, onBroadcast: (roomId: string, message: any) => void) {
    this.id = uuidv4().slice(0, 8).toUpperCase()
    this.router = router
    this.onBroadcast = onBroadcast
  }

  get peerCount(): number {
    return this.peers.size
  }

  addPeer(id: string, username: string): void {
    this.peers.set(id, {
      id,
      username,
      transport: null,
      producer: null,
      consumers: new Map(),
    })

    this.broadcast({
      type: 'peer:joined',
      roomId: this.id,
      senderId: 'server',
      payload: { userId: id, username },
      timestamp: Date.now(),
      id: uuidv4(),
    }, id)
  }

  removePeer(id: string): void {
    const peer = this.peers.get(id)
    if (!peer) return

    peer.producer?.close()
    peer.consumers.forEach((c) => c.close())
    peer.transport?.close()

    this.peers.delete(id)

    this.broadcast({
      type: 'peer:left',
      roomId: this.id,
      senderId: 'server',
      payload: { userId: id },
      timestamp: Date.now(),
      id: uuidv4(),
    })
  }

  async createTransport(peerId: string): Promise<any> {
    const peer = this.peers.get(peerId)
    if (!peer) throw new Error('Peer not found')

    const transport = await this.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: process.env.SFU_IP || process.env.RENDER_EXTERNAL_HOSTNAME || '127.0.0.1' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1_000_000,
    })

    peer.transport = transport

    transport.on('dtlsstatechange', (state) => {
      if (state === 'failed' || state === 'closed') {
        this.removePeer(peerId)
      }
    })

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    }
  }

  async connectTransport(peerId: string, dtlsParameters: any): Promise<void> {
    const peer = this.peers.get(peerId)
    if (!peer?.transport) throw new Error('Transport not found')
    await peer.transport.connect({ dtlsParameters })
  }

  async produce(peerId: string, kind: mediasoup.types.MediaKind, rtpParameters: any): Promise<string> {
    const peer = this.peers.get(peerId)
    if (!peer?.transport) throw new Error('Transport not found')

    const producer = await peer.transport.produce({ kind, rtpParameters })
    peer.producer = producer

    // Create consumers for all other peers
    for (const [otherId, otherPeer] of this.peers) {
      if (otherId === peerId) continue
      if (!otherPeer.transport) continue

      const consumer = await otherPeer.transport.consume({
        producerId: producer.id,
        rtpParameters: producer.rtpParameters,
      } as any)

      otherPeer.consumers.set(producer.id, consumer)

      // Notify the consuming peer
      this.sendToPeer(otherId, {
        type: 'consume',
        roomId: this.id,
        senderId: 'server',
        payload: {
          producerId: producer.id,
          peerId,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        },
        timestamp: Date.now(),
        id: uuidv4(),
      })
    }

    return producer.id
  }

  getState(): any {
    const peers = Array.from(this.peers.entries()).map(([id, peer]) => ({
      id,
      username: peer.username,
    }))
    return { roomId: this.id, peers }
  }

  sendToPeer(peerId: string, message: any): void {
    this.onBroadcast(this.id, { ...message, _target: peerId })
  }

  broadcast(message: any, excludePeerId?: string): void {
    this.onBroadcast(this.id, { ...message, _exclude: excludePeerId })
  }
}
