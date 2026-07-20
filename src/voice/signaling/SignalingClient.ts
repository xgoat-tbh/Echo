import { createMessage } from './protocol'
import type { SignalMessage } from './protocol'
import { SignalMessageType } from './protocol'

type MessageHandler = (msg: SignalMessage) => void

export class SignalingClient {
  private ws: WebSocket | null = null
  private url: string
  private roomId: string
  private senderId: string
  private handlers = new Map<SignalMessageType, Set<MessageHandler>>()
  private pending = new Map<
    string,
    { resolve: (msg: SignalMessage) => void; reject: (err: Error) => void; timer: number }
  >()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private baseDelay = 1000
  private onDisconnect: (() => void) | null = null

  constructor(url: string, roomId: string, senderId: string) {
    this.url = url
    this.roomId = roomId
    this.senderId = senderId
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: SignalMessage = JSON.parse(event.data)
          this.handleMessage(msg)
        } catch {
          // ignore malformed messages
        }
      }

      this.ws.onclose = () => {
        this.onDisconnect?.()
        this.attemptReconnect()
      }

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }
    })
  }

  private handleMessage(msg: SignalMessage): void {
    const pending = this.pending.get(msg.id)
    if (pending) {
      clearTimeout(pending.timer)
      this.pending.delete(msg.id)
      pending.resolve(msg)
      return
    }

    const handlers = this.handlers.get(msg.type)
    if (handlers) {
      for (const handler of handlers) {
        handler(msg)
      }
    }
  }

  on(type: SignalMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  send(type: SignalMessageType, payload: Record<string, unknown> = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const msg = createMessage(type, this.roomId, this.senderId, payload)
    this.ws.send(JSON.stringify(msg))
  }

  request(
    type: SignalMessageType,
    payload: Record<string, unknown> = {},
    timeout = 5000
  ): Promise<SignalMessage> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'))
        return
      }

      const msg = createMessage(type, this.roomId, this.senderId, payload)

      const timer = window.setTimeout(() => {
        this.pending.delete(msg.id)
        reject(new Error(`Request timeout: ${type}`))
      }, timeout)

      this.pending.set(msg.id, { resolve, reject, timer })
      this.ws!.send(JSON.stringify(msg))
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    )
    setTimeout(() => this.connect(), delay)
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error('Disconnected'))
    }
    this.pending.clear()
  }

  setOnDisconnect(handler: () => void): void {
    this.onDisconnect = handler
  }
}
