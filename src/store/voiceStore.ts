import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConnectionGrade = 'poor' | 'fair' | 'good' | 'excellent' | 'connecting'

export interface Player {
  id: string
  username: string
  avatar: string
  isSpeaking: boolean
  isMuted: boolean
  audioLevel: number
  connectionQuality: ConnectionGrade
  isLocal: boolean
}

export interface VoiceSettings {
  inputDeviceId: string | null
  outputDeviceId: string | null
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  pushToTalk: boolean
  pushToTalkKey: string
  individualVolumes: Record<string, number>
}

export interface VoiceDiagnostics {
  rtt: number
  jitter: number
  packetLoss: number
  bitrate: number
  codec: string
  fecActive: boolean
  iceType: string
  localIp: string
  inputLevel: number
  noiseLevel: number
  inputSampleRate: number
  inputDeviceName: string
  outputDeviceName: string
  outputLatency: number
}

interface VoiceState {
  // Connection
  isInVoice: boolean
  isConnecting: boolean
  connectionGrade: ConnectionGrade
  ping: number

  // Audio
  isMuted: boolean
  isPTTActive: boolean
  liveMicLevel: number
  isSpeaking: boolean

  // Players
  players: Player[]
  localPlayerId: string | null

  // Settings
  settings: VoiceSettings
  showSetup: boolean
  showDiagnostics: boolean

  // Diagnostics
  diagnostics: VoiceDiagnostics | null

  // Actions
  setInVoice: (inVoice: boolean) => void
  setConnecting: (connecting: boolean) => void
  setConnectionGrade: (grade: ConnectionGrade) => void
  setPing: (ping: number) => void
  setMuted: (muted: boolean) => void
  setPTTActive: (active: boolean) => void
  setLiveMicLevel: (level: number) => void
  setSpeaking: (speaking: boolean) => void
  setPlayers: (players: Player[]) => void
  updatePlayer: (id: string, update: Partial<Player>) => void
  addPlayer: (player: Player) => void
  removePlayer: (id: string) => void
  setLocalPlayerId: (id: string | null) => void
  updateSettings: (update: Partial<VoiceSettings>) => void
  setShowSetup: (show: boolean) => void
  setShowDiagnostics: (show: boolean) => void
  setDiagnostics: (d: VoiceDiagnostics | null) => void
  setIndividualVolume: (playerId: string, volume: number) => void
}

const defaultSettings: VoiceSettings = {
  inputDeviceId: null,
  outputDeviceId: null,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  pushToTalk: false,
  pushToTalkKey: 'Space',
  individualVolumes: {},
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      isInVoice: false,
      isConnecting: false,
      connectionGrade: 'connecting',
      ping: 0,
      isMuted: false,
      isPTTActive: false,
      liveMicLevel: 0,
      isSpeaking: false,
      players: [],
      localPlayerId: null,
      settings: defaultSettings,
      showSetup: true,
      showDiagnostics: false,
      diagnostics: null,

      setInVoice: (inVoice) => set({ isInVoice: inVoice }),
      setConnecting: (connecting) => set({ isConnecting: connecting }),
      setConnectionGrade: (grade) => set({ connectionGrade: grade }),
      setPing: (ping) => set({ ping }),
      setMuted: (muted) => set({ isMuted: muted }),
      setPTTActive: (active) => set({ isPTTActive: active }),
      setLiveMicLevel: (level) => set({ liveMicLevel: level }),
      setSpeaking: (speaking) => set({ isSpeaking: speaking }),
      setPlayers: (players) => set({ players }),
      updatePlayer: (id, update) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...update } : p
          ),
        })),
      addPlayer: (player) =>
        set((state) => ({ players: [...state.players, player] })),
      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),
      setLocalPlayerId: (id) => set({ localPlayerId: id }),
      updateSettings: (update) =>
        set((state) => ({
          settings: { ...state.settings, ...update },
        })),
      setShowSetup: (show) => set({ showSetup: show }),
      setShowDiagnostics: (show) => set({ showDiagnostics: show }),
      setDiagnostics: (d) => set({ diagnostics: d }),
      setIndividualVolume: (playerId, volume) =>
        set((state) => ({
          settings: {
            ...state.settings,
            individualVolumes: {
              ...state.settings.individualVolumes,
              [playerId]: volume,
            },
          },
        })),
    }),
    {
      name: 'voice-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
