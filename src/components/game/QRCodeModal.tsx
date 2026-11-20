import { Check, Download, Link, Printer, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { downloadDataUrl, generateQrDataUrl, getPublicUrl, isHttpUrl, isLocalUrl } from '../../lib/qrCode'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export function QRCodeModal({ onClose }: { onClose: () => void }) {
  const initial = useMemo(() => getPublicUrl(), [])
  const [urlInput, setUrlInput] = useState(initial.url)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const { copied, copy } = useCopyToClipboard()
  const inputId = useId()

  const url = urlInput.trim()
  const isValid = isHttpUrl(url)
  const showLocalWarning = isValid && isLocalUrl(url)

  useEffect(() => {
    if (!isValid) return
    let cancelled = false
    generateQrDataUrl(url)
      .then((result) => {
        if (cancelled) return
        setDataUrl(result)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [url, isValid])

  return (
    <Modal title="Party QR code" onClose={onClose}>
      {showLocalWarning && (
        <div
          role="alert"
          className="mb-4 flex gap-3 rounded-2xl border border-tangerine/40 bg-tangerine/10 p-4 text-sm text-tangerine"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <p>
            This is a local test address, and guests can&apos;t open it. Set{' '}
            <code className="font-mono">VITE_PUBLIC_APP_URL</code> before building, or paste your real domain below,
            before you print.
          </p>
        </div>
      )}

      <div className="mx-auto w-fit rounded-3xl bg-white p-3">
        {dataUrl && isValid ? (
          <img src={dataUrl} alt={`QR code that opens ${url}`} className="size-64 sm:size-72" />
        ) : (
          <div className="flex size-64 items-center justify-center p-6 text-center text-sm text-neutral-500 sm:size-72">
            {failed ? 'Could not generate the QR code.' : 'Enter a valid http(s) link.'}
          </div>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-mist">
          Link in the QR code
        </label>
        <input
          id={inputId}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          aria-invalid={!isValid}
          className="w-full rounded-2xl border border-white/15 bg-ink px-4 py-3 font-mono text-sm break-all text-paper aria-invalid:border-red-400"
        />
        <p className="mt-1.5 text-xs text-mist">
          {initial.source === 'env'
            ? 'Starting from VITE_PUBLIC_APP_URL. Edits here are for this session only.'
            : 'Starting from the address this page is open at. Edits here are for this session only.'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button
          variant="primary"
          className="flex-col gap-1 px-1 py-3 text-sm"
          disabled={!dataUrl || !isValid}
          onClick={() => dataUrl && downloadDataUrl(dataUrl, 'jenga-and-degenerates-qr.png')}
          icon={<Download aria-hidden className="size-5" />}
        >
          Download
        </Button>
        <Button
          className="flex-col gap-1 px-1 py-3 text-sm"
          disabled={!isValid}
          onClick={() => void copy(url)}
          icon={
            copied ? <Check aria-hidden className="size-5 text-tangerine" /> : <Link aria-hidden className="size-5" />
          }
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button
          className="flex-col gap-1 px-1 py-3 text-sm"
          disabled={!dataUrl || !isValid}
          onClick={() => window.print()}
          icon={<Printer aria-hidden className="size-5" />}
        >
          Print
        </Button>
      </div>

      {/* Only visible when printing: a clean, high-contrast sheet. */}
      {dataUrl && isValid && (
        <div className="print-sheet hidden flex-col items-center justify-center gap-6 p-10 text-center print:flex">
          <h2 className="font-display text-5xl font-bold text-balance">29 &amp; UNHINGED</h2>
          <p className="text-xl text-balance">Pulled a block? Scan to get your prompt.</p>
          <img src={dataUrl} alt="" className="size-[20rem]" />
          <p className="font-mono text-lg break-all">{url}</p>
        </div>
      )}
    </Modal>
  )
}
