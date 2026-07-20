import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LobbyPage } from './app/lobby/page'
import { RoomPage } from './app/room/page'

type View =
  | { name: 'lobby' }
  | { name: 'room'; code: string }

export default function App() {
  const [view, setView] = useState<View>({ name: 'lobby' })

  const handleCreateRoom = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase()
    setView({ name: 'room', code })
  }, [])

  const handleJoinRoom = useCallback((code: string) => {
    setView({ name: 'room', code: code.toUpperCase() })
  }, [])

  const handleLeave = useCallback(() => {
    setView({ name: 'lobby' })
  }, [])

  return (
    <div className="h-full w-full">
      {view.name === 'lobby' ? (
        <LobbyPage
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      ) : (
        <RoomPage
          key={view.code}
          roomCode={view.code}
          onLeave={handleLeave}
        />
      )}
    </div>
  )
}
