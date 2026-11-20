import { describe, expect, it } from 'vitest'
import { isHttpUrl, isLocalUrl, resolvePublicUrl } from './qrCode'

describe('isLocalUrl', () => {
  it.each([
    'http://localhost:5173/',
    'http://127.0.0.1:4173',
    'http://192.168.1.20:5173/',
    'http://10.0.0.5/',
    'http://172.20.1.1/',
    'http://my-laptop.local/',
  ])('treats %s as local', (url) => {
    expect(isLocalUrl(url)).toBe(true)
  })

  it.each(['https://example.com/', 'https://party.example.org/game', 'http://172.32.0.1/', 'not a url'])(
    'treats %s as not local',
    (url) => {
      expect(isLocalUrl(url)).toBe(false)
    },
  )
})

describe('isHttpUrl', () => {
  it('accepts http(s) only', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('http://example.com')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
  })
})

describe('resolvePublicUrl', () => {
  it('prefers the configured production URL', () => {
    expect(resolvePublicUrl('https://mybirthdaydomain.com', 'http://localhost:5173/')).toEqual({
      url: 'https://mybirthdaydomain.com/',
      source: 'env',
    })
  })

  it('falls back to the current page without query or hash', () => {
    expect(resolvePublicUrl(undefined, 'http://localhost:5173/?x=1#top')).toEqual({
      url: 'http://localhost:5173/',
      source: 'current-page',
    })
  })

  it('ignores blank or invalid configured values', () => {
    expect(resolvePublicUrl('   ', 'https://a.com/').source).toBe('current-page')
    expect(resolvePublicUrl('your-domain.com', 'https://a.com/').source).toBe('current-page')
  })
})
