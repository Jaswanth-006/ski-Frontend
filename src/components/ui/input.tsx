import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[10px] border border-line bg-card px-3 text-sm text-ink',
        'placeholder:text-muted outline-none transition-colors',
        'focus-visible:border-orange focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
