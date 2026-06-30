import { cva, type VariantProps } from 'class-variance-authority'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-semibold text-[13px] rounded-[10px] transition-[box-shadow,background-color,border-color] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-orange text-white shadow-primary hover:bg-orange-600',
        ghost: 'bg-card text-navy border border-line hover:bg-surface hover:border-navy/20',
      },
      size: {
        default: 'px-[15px] py-[9px]',
        icon: 'h-[38px] w-[38px] p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export type ButtonProps = HTMLMotionProps<'button'> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
