import { describe, expect, it } from 'vitest'
import { parseSubmissions, resolveSubmitUrl } from './submissionParsing'

describe('parseSubmissions', () => {
  it('converts valid items and trims names', () => {
    expect(
      parseSubmissions([{ id: 'a', category: 'DARE', text: 'Do a dance', spicy: true, submittedBy: ' Sam ' }]),
    ).toEqual([{ id: 'a', category: 'dare', text: 'Do a dance', spicy: true, submittedBy: 'Sam' }])
  })

  it('treats a missing or blank name as anonymous', () => {
    const [first, second] = parseSubmissions([
      { id: 'a', category: 'TRUTH', text: 'Tell a secret', spicy: false, submittedBy: null },
      { id: 'b', category: 'TRUTH', text: 'Tell another', spicy: false, submittedBy: '  ' },
    ])
    expect(first?.submittedBy).toBeNull()
    expect(second?.submittedBy).toBeNull()
  })

  it('drops malformed items and non-arrays', () => {
    expect(parseSubmissions([{ id: 'a' }, null, 5])).toEqual([])
    expect(parseSubmissions(undefined)).toEqual([])
  })
})

describe('resolveSubmitUrl', () => {
  it('points at /submit on the public site', () => {
    expect(resolveSubmitUrl('https://jenga.codewithpatrick.dev')).toBe('https://jenga.codewithpatrick.dev/submit')
    expect(resolveSubmitUrl('https://jenga.codewithpatrick.dev/admin?tab=x')).toBe(
      'https://jenga.codewithpatrick.dev/submit',
    )
  })
})
