/** Same idea as storage.ts, but for sessionStorage: cleared when the tab closes. Never throws. */

export function readSessionString(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSessionString(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the session just won't survive a refresh.
  }
}

export function removeSessionKey(key: string): void {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Nothing useful to do.
  }
}
