import { Lock } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../ui/Button'

interface AdminLoginProps {
  onLogin: (password: string) => Promise<string | null>
  /** Two-line heading, e.g. ['Card', 'manager']. */
  heading?: readonly [string, string]
  description?: string
}

export function AdminLogin({
  onLogin,
  heading = ['Card', 'manager'],
  description = 'Hosts only. Enter the admin password to edit the deck.',
}: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const inputId = useId()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password || pending) return
    setPending(true)
    setError(null)
    const failure = await onLogin(password)
    // On success this screen is replaced, so only the failure case needs handling.
    if (failure) {
      setError(failure)
      setPending(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8 px-5 py-10">
      <div>
        <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl border border-hot/40 bg-hot/10 text-hot">
          <Lock aria-hidden className="size-7" />
        </span>
        <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tighter">
          {heading[0]}
          <br />
          {heading[1]}
        </h1>
        <p className="mt-4 text-lg text-mist">{description}</p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-mist">
            Admin password
          </label>
          <input
            id={inputId}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error !== null}
            className="min-h-14 w-full rounded-2xl border border-white/15 bg-plum px-4 text-lg text-paper aria-invalid:border-red-400"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!password || pending}>
          {pending ? 'Checking…' : 'Unlock'}
        </Button>
      </form>

      <Link to="/" className="text-center text-sm text-mist underline underline-offset-4 hover:text-paper">
        Back to the game
      </Link>
    </main>
  )
}
