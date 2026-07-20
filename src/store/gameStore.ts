import { create } from 'zustand'

export type GamePhase =
  | 'lobby'
  | 'assigning'
  | 'clue'        // Each player gives their clue
  | 'discussion'  // Open discussion after all clues
  | 'voting'      // Voting phase
  | 'reveal'      // Reveal the Echo
  | 'results'     // Game over

export interface Player {
  id: string
  username: string
  avatar: string
  isReady: boolean
  hasSpoken: boolean
  hasVoted: boolean
  isEcho: boolean
  voteTarget: string | null
  clue: string | null
  word: string | null
  // Voice
  isSpeaking: boolean
  isMuted: boolean
  audioLevel: number
}

export interface Vote {
  voterId: string
  targetId: string
}

interface GameState {
  // Room
  roomCode: string | null

  // Game
  phase: GamePhase
  round: number
  players: Player[]
  localPlayerId: string | null
  currentSpeakerIndex: number
  votes: Vote[]

  // Words
  publicWord: string | null        // The word most players have
  echoWord: string | null          // The Echo player's word
  localWord: string | null         // This client's word

  // Reveal
  revealedEchoId: string | null

  // Settings
  maxPlayers: number
  clueTimeSeconds: number
  discussionTimeSeconds: number
  votingTimeSeconds: number

  // Actions
  setRoomCode: (code: string) => void
  setPhase: (phase: GamePhase) => void
  setRound: (round: number) => void
  setPlayers: (players: Player[]) => void
  updatePlayer: (id: string, update: Partial<Player>) => void
  addPlayer: (player: Omit<Player, 'hasSpoken' | 'hasVoted' | 'isEcho' | 'voteTarget' | 'clue' | 'word' | 'isSpeaking' | 'isMuted' | 'audioLevel'>) => void
  removePlayer: (id: string) => void
  setLocalPlayerId: (id: string | null) => void
  setCurrentSpeakerIndex: (index: number) => void
  submitClue: (playerId: string, clue: string) => void
  castVote: (voterId: string, targetId: string) => void
  setRevealedEchoId: (id: string | null) => void
  setLocalWord: (word: string | null) => void
  reset: () => void
}

const initialPlayerState = {
  hasSpoken: false,
  hasVoted: false,
  isEcho: false,
  voteTarget: null,
  clue: null,
  word: null,
  isSpeaking: false,
  isMuted: false,
  audioLevel: 0,
}

export const useGameStore = create<GameState>((set) => ({
  roomCode: null,
  phase: 'lobby',
  round: 1,
  players: [],
  localPlayerId: null,
  currentSpeakerIndex: 0,
  votes: [],
  publicWord: null,
  echoWord: null,
  localWord: null,
  revealedEchoId: null,
  maxPlayers: 12,
  clueTimeSeconds: 30,
  discussionTimeSeconds: 120,
  votingTimeSeconds: 30,

  setRoomCode: (code) => set({ roomCode: code }),
  setPhase: (phase) => set({ phase }),
  setRound: (round) => set({ round }),
  setPlayers: (players) => set({ players }),
  updatePlayer: (id, update) =>
    set((state) => ({
      players: state.players.map((p) => (p.id === id ? { ...p, ...update } : p)),
    })),
  addPlayer: (player) =>
    set((state) => ({
      players: [...state.players, { ...initialPlayerState, ...player }],
    })),
  removePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),
  setLocalPlayerId: (id) => set({ localPlayerId: id }),
  setCurrentSpeakerIndex: (index) => set({ currentSpeakerIndex: index }),
  submitClue: (playerId, clue) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, clue, hasSpoken: true } : p
      ),
    })),
  castVote: (voterId, targetId) =>
    set((state) => ({
      votes: [...state.votes, { voterId, targetId }],
      players: state.players.map((p) =>
        p.id === voterId ? { ...p, hasVoted: true, voteTarget: targetId } : p
      ),
    })),
  setRevealedEchoId: (id) => set({ revealedEchoId: id }),
  setLocalWord: (word) => set({ localWord: word }),
  reset: () =>
    set({
      phase: 'lobby',
      round: 1,
      players: [],
      localPlayerId: null,
      currentSpeakerIndex: 0,
      votes: [],
      publicWord: null,
      echoWord: null,
      localWord: null,
      revealedEchoId: null,
    }),
}))
