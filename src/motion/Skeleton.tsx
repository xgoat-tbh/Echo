import { motion } from 'framer-motion'
import { cn } from '../lib/cn'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <motion.div
      className={cn('rounded-md bg-bg-tertiary/65', className)}
      style={style}
      animate={{ opacity: [0.35, 0.6, 0.35] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function PlayerCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-bg-secondary/40 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-2.5 w-14 rounded" />
        </div>
      </div>
      <Skeleton className="h-[28px] w-full rounded-lg mt-1" />
    </div>
  )
}

export function PlayerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  )
}
