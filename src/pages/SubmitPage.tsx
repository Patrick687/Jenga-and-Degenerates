import { Link } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { SuggestCardForm } from '../components/submit/SuggestCardForm'

/** Public page guests reach by QR code to suggest a card. The host approves before it goes in the deck. */
export function SubmitPage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">Add a card</h1>
        <p className="mt-2 mb-6 text-mist">Got a good truth, dare or chaos? Add it and it goes straight into the deck.</p>
        <SuggestCardForm />
        <Link to="/" className="mt-8 text-center text-sm text-mist underline underline-offset-4 hover:text-paper">
          Back to the game
        </Link>
      </main>
    </AppShell>
  )
}
