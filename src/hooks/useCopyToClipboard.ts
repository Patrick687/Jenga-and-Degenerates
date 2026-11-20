import { useCallback, useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

/** Copy helper that exposes a short-lived `copied` flag for button feedback. */
export function useCopyToClipboard(resetAfterMs = 1800) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeoutRef.current), [])

  const copy = useCallback(
    async (text: string) => {
      const succeeded = await copyText(text)
      if (!succeeded) return false
      setCopied(true)
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), resetAfterMs)
      return true
    },
    [resetAfterMs],
  )

  return { copied, copy }
}
