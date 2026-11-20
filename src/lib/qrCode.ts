import { toDataURL } from 'qrcode'

export interface PublicUrlInfo {
  url: string
  /** Where the URL came from: the build-time env var, or the address the page is open at. */
  source: 'env' | 'current-page'
}

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** True for localhost, loopback, .local names and private-network addresses a guest's phone can't reach. */
export function isLocalUrl(value: string): boolean {
  let hostname: string
  try {
    hostname = new URL(value).hostname.toLowerCase()
  } catch {
    return false
  }
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return true
  }
  if (hostname === '[::1]' || hostname === '0.0.0.0') return true
  const octets = hostname.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/)
  if (!octets) return false
  const first = Number(octets[1])
  const second = Number(octets[2])
  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 169 && second === 254)
  )
}

/**
 * The URL the QR code should point at: the configured production URL when
 * valid, otherwise the current page (minus query string and hash).
 */
export function resolvePublicUrl(configuredUrl: string | undefined, currentHref: string): PublicUrlInfo {
  const configured = configuredUrl?.trim()
  if (configured && isHttpUrl(configured)) {
    return { url: new URL(configured).toString(), source: 'env' }
  }
  const current = new URL(currentHref)
  current.search = ''
  current.hash = ''
  return { url: current.toString(), source: 'current-page' }
}

export function getPublicUrl(): PublicUrlInfo {
  return resolvePublicUrl(import.meta.env.VITE_PUBLIC_APP_URL, window.location.href)
}

/** Black on white, 1024px, generous quiet zone: scans reliably on screen and on paper. */
export function generateQrDataUrl(url: string): Promise<string> {
  return toDataURL(url, {
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  })
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
