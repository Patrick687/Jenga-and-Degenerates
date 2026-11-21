import { describe, expect, it } from 'vitest'
import { resolveSubmitUrl } from './submitUrl'

describe('resolveSubmitUrl', () => {
  it('points at /submit on the public site', () => {
    expect(resolveSubmitUrl('https://jenga.codewithpatrick.dev')).toBe('https://jenga.codewithpatrick.dev/submit')
    expect(resolveSubmitUrl('https://jenga.codewithpatrick.dev/admin?tab=x')).toBe(
      'https://jenga.codewithpatrick.dev/submit',
    )
  })
})
