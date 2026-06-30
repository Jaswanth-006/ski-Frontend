import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Seconds to delay the reveal (stagger sections). */
  delay?: number
  children: ReactNode
}

/** Section reveal: fade + 10px rise (DESIGN_SYSTEM §5). No-op under reduced motion. */
export function Reveal({ delay = 0, children, className, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1], delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
