import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface AvatarProps {
  src?: string
  username: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isSpeaking?: boolean
  isMuted?: boolean
  status?: 'online' | 'idle' | 'offline' | 'connecting'
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const

const statusColors: Record<string, string> = {
  online: 'bg-success',
  idle: 'bg-warning',
  offline: 'bg-text-tertiary',
  connecting: 'bg-text-tertiary animate-pulse',
}

export function Avatar({
  src,
  username,
  size = 'md',
  isSpeaking,
  isMuted,
  status,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = sizeMap[size]
  const initials = username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative shrink-0">
      <motion.div
        animate={
          isSpeaking
            ? { scale: 1.05 }
            : { scale: 1 }
        }
        transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        className={cn(
          'overflow-hidden rounded-full',
          isSpeaking && 'ring-2 ring-accent'
        )}
        style={{ width: px, height: px }}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={username}
            width={px}
            height={px}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-accent-subtle text-sm font-semibold text-accent"
            style={{ fontSize: px * 0.35 }}
          >
            {initials}
          </div>
        )}
      </motion.div>

      {isMuted && (
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      )}

      {status && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg',
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}
