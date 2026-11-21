import { Check, CheckCheck, Download, Flame, Link2, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { approveAllSubmissions, approveSubmission, rejectSubmission } from '../../features/submissions/api/submissionsApi'
import type { CardDraft } from '../../features/cards/api/cardsApi'
import { CATEGORY_META } from '../../features/game/data/categories'
import { resolveSubmitUrl } from '../../features/submissions/utils/submissionParsing'
import type { Submission } from '../../features/submissions/types'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { GraphQLRequestError } from '../../lib/graphql'
import { downloadDataUrl, generateQrDataUrl, getPublicUrl } from '../../lib/qrCode'
import { CATEGORY_THEME } from '../game/categoryTheme'
import { Button } from '../ui/Button'
import { CardEditorModal } from './CardEditorModal'

interface SubmissionsManagerProps {
  password: string
  onLogout: () => void
  submissions: Submission[] | null
  error: string | null
  refresh: () => Promise<void>
}

/** Host view of the suggestion box, plus the QR code guests scan to add to it. */
export function SubmissionsManager({ password, onLogout, submissions, error, refresh }: SubmissionsManagerProps) {
  const [qr, setQr] = useState<string | null>(null)
  const [editing, setEditing] = useState<Submission | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { copied, copy } = useCopyToClipboard()
  const url = useMemo(() => resolveSubmitUrl(getPublicUrl().url), [])

  useEffect(() => {
    let cancelled = false
    generateQrDataUrl(url)
      .then((result) => {
        if (!cancelled) setQr(result)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [url])

  const run = async (task: () => Promise<string | null>): Promise<string | null> => {
    setMessage(null)
    setBusy(true)
    try {
      const note = await task()
      await refresh()
      if (note) setMessage(note)
      return null
    } catch (caught) {
      if (caught instanceof GraphQLRequestError && caught.kind === 'unauthorized') onLogout()
      const text = caught instanceof GraphQLRequestError ? caught.message : 'Something went wrong.'
      setMessage(text)
      return text
    } finally {
      setBusy(false)
    }
  }

  const approve = (item: Submission) =>
    run(async () => {
      await approveSubmission(password, item.id)
      return null
    })
  const reject = (item: Submission) =>
    run(async () => {
      await rejectSubmission(password, item.id)
      return null
    })
  const approveAll = () =>
    run(async () => {
      const added = await approveAllSubmissions(password)
      return `Added ${added} ${added === 1 ? 'card' : 'cards'} to the deck.`
    })

  const saveEdited = async (draft: CardDraft): Promise<string | null> => {
    if (!editing) return null
    const failure = await run(async () => {
      await approveSubmission(password, editing.id, draft)
      return null
    })
    if (!failure) setEditing(null)
    return failure
  }

  const count = submissions?.length ?? 0

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-12">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Card suggestions</h1>
          <p className="mt-2 text-sm text-mist">
            Guests scan the code to suggest cards. Approved ones join the deck right away.
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-plum p-5 text-center">
          <h2 className="font-display text-xl font-bold">Suggestion QR code</h2>
          <div className="mx-auto mt-4 w-fit rounded-3xl bg-white p-3">
            {qr ? <img src={qr} alt={`QR code that opens ${url}`} className="size-56" /> : <div className="size-56" />}
          </div>
          <p className="mt-3 text-sm break-all text-mist">{url}</p>
          <div className="mt-4 flex gap-3">
            <Button
              className="flex-1"
              onClick={() => void copy(url)}
              icon={copied ? <Check aria-hidden className="size-5" /> : <Link2 aria-hidden className="size-5" />}
            >
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              className="flex-1"
              disabled={!qr}
              onClick={() => qr && downloadDataUrl(qr, 'card-suggestions-qr.png')}
              icon={<Download aria-hidden className="size-5" />}
            >
              Download
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Waiting for you{submissions ? ` (${count})` : ''}</h2>
            {count > 1 && (
              <Button
                className="min-h-10 px-4 text-sm"
                disabled={busy}
                onClick={() => void approveAll()}
                icon={<CheckCheck aria-hidden className="size-4" />}
              >
                Approve all
              </Button>
            )}
          </div>

          {(message ?? error) && (
            <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
              {message ?? error}
            </p>
          )}

          {submissions && count === 0 && (
            <p className="rounded-2xl border border-white/10 bg-plum p-4 text-mist">Nothing waiting. Share the code!</p>
          )}

          <ul className="space-y-3">
            {submissions?.map((item) => {
              const theme = CATEGORY_THEME[item.category]
              return (
                <li key={item.id} className="rounded-2xl border border-white/10 bg-plum p-4">
                  <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-xs font-bold tracking-[0.14em] uppercase">
                    <span className={`inline-flex items-center gap-1.5 ${theme.text}`}>
                      <theme.Icon aria-hidden className="size-3.5" />
                      {CATEGORY_META[item.category].label}
                    </span>
                    {item.spicy && (
                      <span className="inline-flex items-center gap-1 text-hot">
                        <Flame aria-hidden className="size-3.5" />
                        Spicy
                      </span>
                    )}
                    {item.submittedBy && <span className="text-mist normal-case tracking-normal">from {item.submittedBy}</span>}
                  </p>
                  <p className="text-base leading-snug">{item.text}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      variant="primary"
                      className="min-h-11 px-3 text-sm"
                      disabled={busy}
                      aria-label={`Approve: ${item.text}`}
                      onClick={() => void approve(item)}
                      icon={<Check aria-hidden className="size-4" />}
                    >
                      Approve
                    </Button>
                    <Button
                      className="min-h-11 px-3 text-sm"
                      disabled={busy}
                      aria-label={`Edit: ${item.text}`}
                      onClick={() => setEditing(item)}
                      icon={<Pencil aria-hidden className="size-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="min-h-11 px-3 text-sm"
                      disabled={busy}
                      aria-label={`Reject: ${item.text}`}
                      onClick={() => void reject(item)}
                      icon={<X aria-hidden className="size-4" />}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </main>

      {editing && (
        <CardEditorModal
          card={{ id: editing.id, category: editing.category, text: editing.text, spicy: editing.spicy }}
          defaultCategory={editing.category}
          title="Edit and approve"
          saveLabel="Approve"
          onSave={saveEdited}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
