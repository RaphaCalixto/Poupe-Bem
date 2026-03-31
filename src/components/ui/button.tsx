import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--m3-primary)] text-[var(--m3-on-primary)] shadow-[var(--m3-elevation-1)] hover:brightness-110',
        secondary:
          'bg-[var(--m3-surface-container-high)] text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container)]',
        outline:
          'border border-[var(--m3-outline)] bg-transparent text-[var(--m3-on-surface)] hover:bg-[var(--m3-surface-container)]',
        tonal:
          'bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)] hover:brightness-105',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4',
        lg: 'h-12 px-7',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
