import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface IconButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'aria-label'> {
  /** Required: icon-only buttons need an accessible name. */
  label: string
  children: ReactNode
}

export function IconButton({ label, className = '', type = 'button', children, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`relative inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-plum text-paper transition hover:bg-white/10 active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
