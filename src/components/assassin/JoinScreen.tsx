import { Skull } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '../ui/Button'

interface JoinScreenProps {
  onJoin: (name: string) => Promise<string | null>
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const inputId = useId()
  const trimmed = name.trim()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (trimmed.length < 2 || pending) return
    setPending(true)
    setError(null)
    const failure = await onJoin(trimmed)
    // On success this screen is replaced, so only the failure case needs handling.
    if (failure) {
      setError(failure)
      setPending(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8 px-5 py-10">
      <div className="animate-fade-up">
        <span className="mb-5 inline-flex size-16 animate-float items-center justify-center rounded-2xl border border-hot/40 bg-hot/10 text-hot">
          <Skull aria-hidden className="size-8" />
        </span>
        <h1 className="font-display text-6xl leading-[0.9] font-bold tracking-tighter">
          Assassin
          <br />
          <span className="text-hot">at the party</span>
        </h1>
        <p className="mt-5 text-lg text-mist">
          Someone in this room is out to get you. Sign in with a name everyone will recognise.
        </p>
      </div>

      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-mist">
            Your name
          </label>
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            autoCapitalize="words"
            autoFocus
            maxLength={24}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error !== null}
            placeholder="e.g. Pat"
            className="min-h-14 w-full rounded-2xl border border-white/15 bg-plum px-4 text-lg text-paper placeholder:text-mist/60 aria-invalid:border-red-400"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={trimmed.length < 2 || pending}>
          {pending ? 'Joining…' : 'Join the party'}
        </Button>
      </form>

      <ul className="space-y-2 text-sm text-mist">
        <li>• If an assassin winks at you, die dramatically, wherever you are.</li>
        <li>• Work out who the assassins are, and vote them out.</li>
        <li>• Your secret role is revealed on the next screen. Shield your phone.</li>
      </ul>
    </main>
  )
}
