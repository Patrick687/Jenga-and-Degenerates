import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-hot text-ink shadow-[0_10px_32px_-10px_rgba(244,90,167,0.8)] hover:brightness-110',
  secondary: 'border border-white/15 bg-plum text-paper hover:bg-white/10',
  ghost: 'text-mist hover:bg-white/10 hover:text-paper',
  danger: 'border border-red-400/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
}

const SIZE_CLASSES: Record<Size, string> = {
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-16 px-6 text-lg',
}

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2.5 rounded-2xl font-display font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
