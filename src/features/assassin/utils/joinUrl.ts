/**
 * The address guests scan to join: the dedicated Assassin address if one is configured,
 * otherwise the main site's /assassin page.
 */
export function resolveJoinUrl(configuredAssassinUrl: string | undefined, publicUrl: string): string {
  const configured = configuredAssassinUrl?.trim()
  if (configured) return configured

  try {
    return new URL('/assassin', publicUrl).toString()
  } catch {
    return `${publicUrl.replace(/\/$/, '')}/assassin`
  }
}
