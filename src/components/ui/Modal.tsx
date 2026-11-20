import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Bottom sheet on phones, centered card on larger screens. Built on the native
 * <dialog> element, so Escape, focus trapping, and the backdrop come for free.
 * Mount it to open it and unmount it to close it.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicks on the backdrop land on the <dialog> element itself.
        if (event.target === dialogRef.current) onClose()
      }}
      className="m-0 mx-auto mt-auto w-full max-w-lg animate-sheet-in overflow-hidden rounded-t-[2rem] border border-white/10 bg-plum p-0 text-paper shadow-2xl sm:my-auto sm:rounded-[2rem]"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-3">
          <h2 id={titleId} className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="bg-white/5">
            <X aria-hidden className="size-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </dialog>
  )
}
