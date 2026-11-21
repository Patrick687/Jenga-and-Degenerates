/** The page guests scan to add a card. */
export function resolveSubmitUrl(publicUrl: string): string {
  try {
    return new URL('/submit', publicUrl).toString()
  } catch {
    return `${publicUrl.replace(/\/$/, '')}/submit`
  }
}
