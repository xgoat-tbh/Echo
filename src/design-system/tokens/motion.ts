import type { Easing as FramerEasing } from 'framer-motion'

export const MotionTiming = {
  instant: 50,
  fast: 100,
  quick: 150,
  normal: 200,
  slow: 300,
  page: 400,
  reveal: 600,
} as const

export const Easing = {
  spring: [0.34, 1.56, 0.64, 1] as FramerEasing,
  exit: [0.32, 0, 0.67, 0] as FramerEasing,
  enter: [0, 0.55, 0.45, 1] as FramerEasing,
  emphasis: [0.22, 1, 0.36, 1] as FramerEasing,
  linear: [0, 0, 1, 1] as FramerEasing,
  decelerate: [0, 0, 0.2, 1] as FramerEasing,
  accelerate: [0.4, 0, 1, 1] as FramerEasing,
} as const

type TransitionConfig = {
  duration: number
  ease: FramerEasing
  delay?: number
}

type AnimationPreset = {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  exit: Record<string, number | string>
  transition: TransitionConfig
}

export const Presets: Record<string, AnimationPreset> = {
  slideUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: MotionTiming.normal / 1000, ease: Easing.spring },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: MotionTiming.quick / 1000, ease: Easing.enter },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.92 },
    transition: { duration: MotionTiming.normal / 1000, ease: Easing.spring },
  },
}

export const Stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.03 } },
  },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: MotionTiming.normal / 1000, ease: Easing.enter },
  },
}
