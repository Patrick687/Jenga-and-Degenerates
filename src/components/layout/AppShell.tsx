import type { ReactNode } from 'react'

/** Page frame: near-black background, blurred neon glows, centered column. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-ink">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-96 rounded-full bg-hot/20 blur-[110px]" />
        <div className="absolute top-1/3 -right-32 size-96 rounded-full bg-grape/20 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 size-96 rounded-full bg-tangerine/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col">{children}</div>
    </div>
  )
}
