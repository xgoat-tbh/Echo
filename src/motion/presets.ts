import { MotionTiming } from '../design-system/tokens/motion'

export const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, scale: 0.98, filter: 'blur(4px)' },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export const overlayTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export const panelSlideUp = {
  initial: { opacity: 0, y: 20, scale: 0.97, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 12, scale: 0.97, filter: 'blur(2px)' },
  transition: { type: 'spring' as const, stiffness: 380, damping: 30 },
}
