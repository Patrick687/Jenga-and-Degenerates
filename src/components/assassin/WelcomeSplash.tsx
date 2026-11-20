import { useEffect } from 'react'

interface WelcomeSplashProps {
  name: string
  onDone: () => void
}

const CONFETTI = ['✨', '🎲', '🧩', '🕵️', '🎮', '🔪', '⭐', '🎉']
const PIECES = Array.from({ length: 24 }, (_, index) => ({
  symbol: CONFETTI[index % CONFETTI.length]!,
  left: (index * 37) % 100,
  delay: (index % 8) * 0.28,
  size: 1.2 + ((index * 7) % 10) / 10,
}))

/** A short welcome animation after signing in. Tap anywhere to skip. */
export function WelcomeSplash({ name, onDone }: WelcomeSplashProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3400)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Continue"
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      <div aria-hidden className="motion-reduce:hidden">
        {PIECES.map((piece, index) => (
          <span
            key={index}
            className="animate-confetti pointer-events-none absolute -top-8"
            style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s`, fontSize: `${piece.size}rem` }}
          >
            {piece.symbol}
          </span>
        ))}
      </div>

      <p className="animate-fade-up text-lg font-semibold tracking-[0.2em] text-mist uppercase">Welcome to the party</p>
      <h1 className="mt-4 animate-welcome-pop font-display text-6xl leading-none font-bold tracking-tighter break-words text-hot [animation-delay:250ms]">
        {name}
      </h1>
      <p className="mt-6 animate-fade-up text-mist [animation-delay:900ms]">Trust no one. Wink responsibly.</p>
    </button>
  )
}
