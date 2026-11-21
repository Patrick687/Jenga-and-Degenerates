import { Check, Download, Link2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { resolveSubmitUrl } from '../../features/submissions/utils/submitUrl'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { downloadDataUrl, generateQrDataUrl, getPublicUrl } from '../../lib/qrCode'
import { Button } from '../ui/Button'

/** The QR code guests scan to add their own cards. Bad ones can be deleted in the Jenga cards tab. */
export function CardQrCode() {
  const [qr, setQr] = useState<string | null>(null)
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

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-12">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Add-a-card code</h1>
        <p className="mt-2 text-sm text-mist">
          Guests scan this to add their own cards. They go straight into the deck. Delete any you don&apos;t want in the
          Jenga cards tab.
        </p>
      </div>

      <section className="rounded-3xl border border-white/10 bg-plum p-5 text-center">
        <div className="mx-auto w-fit rounded-3xl bg-white p-3">
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
            onClick={() => qr && downloadDataUrl(qr, 'add-a-card-qr.png')}
            icon={<Download aria-hidden className="size-5" />}
          >
            Download
          </Button>
        </div>
      </section>
    </main>
  )
}
