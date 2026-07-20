import { SignalingClient } from '../signaling/SignalingClient'
import { SignalMessageType } from '../signaling/protocol'

export type ConnectionGrade = 'poor' | 'fair' | 'good' | 'excellent' | 'connecting'

export interface ConnectionStats {
  rtt: number
  packetLoss: number
  jitter: number
  bitrate: number
  grade: ConnectionGrade
}

export class ConnectionManager {
  private signaling: SignalingClient | null = null
  private onStats: ((stats: ConnectionStats) => void) | null = null
  private onDisconnect: (() => void) | null = null
  private statsInterval: number | null = null
  private connectionGrade: ConnectionGrade = 'connecting'

  constructor(
    onStats?: (stats: ConnectionStats) => void,
    onDisconnect?: () => void
  ) {
    this.onStats = onStats ?? null
    this.onDisconnect = onDisconnect ?? null
  }

  get grade(): ConnectionGrade {
    return this.connectionGrade
  }

  get client(): SignalingClient | null {
    return this.signaling
  }

  async connect(
    serverUrl: string,
    roomId: string,
    userId: string
  ): Promise<void> {
    this.connectionGrade = 'connecting'
    this.onStats?.({
      rtt: 0,
      packetLoss: 0,
      jitter: 0,
      bitrate: 0,
      grade: 'connecting',
    })

    this.signaling = new SignalingClient(serverUrl, roomId, userId)
    this.signaling.setOnDisconnect(() => {
      this.connectionGrade = 'connecting'
      this.onDisconnect?.()
    })

    await this.signaling.connect()
    this.signaling.send(SignalMessageType.ROOM_JOIN, { roomId })

    this.startStatsPolling()
  }

  private startStatsPolling(): void {
    const estimateGrade = (stats: ConnectionStats): ConnectionGrade => {
      if (stats.rtt > 300 || stats.packetLoss > 0.1 || stats.jitter > 60) return 'poor'
      if (stats.rtt > 200 || stats.packetLoss > 0.05 || stats.jitter > 40) return 'fair'
      if (stats.rtt > 100 || stats.packetLoss > 0.02 || stats.jitter > 20) return 'good'
      return 'excellent'
    }

    this.statsInterval = window.setInterval(() => {
      const rtt = Math.max(10, Math.floor(Math.random() * 80 + 20))
      const loss = Math.random() * 0.02
      const jitter = Math.random() * 15 + 2
      const bitrate = 96000 + Math.floor(Math.random() * 32000)

      const stats: ConnectionStats = { rtt, packetLoss: loss, jitter, bitrate, grade: 'good' }
      stats.grade = estimateGrade(stats)
      this.connectionGrade = stats.grade
      this.onStats?.(stats)
    }, 2000)
  }

  async requestTransport(): Promise<any> {
    if (!this.signaling) throw new Error('Not connected')
    const response = await this.signaling.request(SignalMessageType.TRANSPORT_CREATE)
    return response.payload
  }

  async connectTransport(dtlsParameters: any): Promise<void> {
    if (!this.signaling) throw new Error('Not connected')
    await this.signaling.request(SignalMessageType.TRANSPORT_CONNECT, {
      dtlsParameters,
    })
  }

  async produce(kind: string, rtpParameters: any): Promise<string> {
    if (!this.signaling) throw new Error('Not connected')
    const response = await this.signaling.request(SignalMessageType.PRODUCE, {
      kind,
      rtpParameters,
    })
    return response.payload.id as string
  }

  onPeerJoined(handler: (peer: any) => void): () => void {
    return this.signaling!.on(SignalMessageType.PEER_JOINED, (msg) =>
      handler(msg.payload)
    )
  }

  onPeerLeft(handler: (peerId: string) => void): () => void {
    return this.signaling!.on(SignalMessageType.PEER_LEFT, (msg) =>
      handler(msg.payload.userId as string)
    )
  }

  disconnect(): void {
    if (this.statsInterval !== null) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
    this.signaling?.send(SignalMessageType.ROOM_LEAVE)
    this.signaling?.disconnect()
    this.signaling = null
    this.connectionGrade = 'connecting'
  }
}
