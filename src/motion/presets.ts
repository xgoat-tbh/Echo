import { MotionTiming, Easing } from '../design-system/tokens/motion'
import type { Easing as FramerEasing } from 'framer-motion'

export const pageTransition = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: MotionTiming.page / 1000, ease: Easing.emphasis },
}

export const overlayTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MotionTiming.normal / 1000, ease: Easing.enter },
}

export const panelSlideUp = {
  initial: { opacity: 0, y: 24, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.95 },
  transition: { duration: MotionTiming.slow / 1000, ease: Easing.spring },
}
