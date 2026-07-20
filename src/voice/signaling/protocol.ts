export enum SignalMessageType {
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_DESTROY = 'room:destroy',
  ROOM_STATE = 'room:state',
  ROOM_ERROR = 'room:error',

  TRANSPORT_CREATE = 'transport:create',
  TRANSPORT_CONNECT = 'transport:connect',
  PRODUCE = 'produce',
  CONSUME = 'consume',
  ICE_CANDIDATE = 'ice:candidate',

  PEER_JOINED = 'peer:joined',
  PEER_LEFT = 'peer:left',
  PEER_SPEAKING = 'peer:speaking',
  PEER_MUTED = 'peer:muted',
  PEER_DEVICE_CHANGE = 'peer:device:change',
  RECONNECT = 'reconnect',
}

export interface SignalMessage {
  type: SignalMessageType
  roomId: string
  senderId: string
  payload: Record<string, unknown>
  timestamp: number
  id: string
}

export function createMessage(
  type: SignalMessageType,
  roomId: string,
  senderId: string,
  payload: Record<string, unknown> = {}
): SignalMessage {
  return {
    type,
    roomId,
    senderId,
    payload,
    timestamp: Date.now(),
    id: crypto.randomUUID(),
  }
}
