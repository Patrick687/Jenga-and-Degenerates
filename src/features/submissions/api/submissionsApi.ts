import { graphqlRequest } from '../../../lib/graphql'
import type { Prompt } from '../../game/types/game.types'
import type { CardDraft } from '../../cards/api/cardsApi'
import { parseApiCard, toApiCategory } from '../../cards/utils/cardParsing'
import type { Submission } from '../types'
import { parseSubmissions } from '../utils/submissionParsing'

export interface SubmissionDraft extends CardDraft {
  /** Optional nickname so the host knows who to credit. */
  submittedBy: string
}

/** Public: any guest can suggest a card. It only joins the deck once the host approves it. */
export async function submitCard(draft: SubmissionDraft): Promise<void> {
  const name = draft.submittedBy.trim()
  await graphqlRequest(`mutation ($input: SubmitCardInput!) { submitCard(input: $input) }`, {
    variables: {
      input: {
        category: toApiCategory(draft.category),
        text: draft.text,
        spicy: draft.spicy,
        submittedBy: name === '' ? null : name,
      },
    },
  })
}

export async function fetchSubmissions(password: string): Promise<Submission[]> {
  const data = await graphqlRequest(
    'query { adminCardSubmissions { id category text spicy submittedBy } }',
    { password },
  )
  return parseSubmissions(data.adminCardSubmissions)
}

/** Adds the suggestion to the deck. Pass a draft when the host edited the wording first. */
export async function approveSubmission(password: string, id: string, edits?: CardDraft): Promise<Prompt> {
  const data = await graphqlRequest(
    `mutation ($id: ID!, $edits: UpdateCardInput) {
      approveSubmission(id: $id, edits: $edits) { id category text spicy }
    }`,
    {
      password,
      variables: { id, edits: edits ? { ...edits, category: toApiCategory(edits.category) } : null },
    },
  )
  const card = parseApiCard(data.approveSubmission)
  if (!card) throw new Error('The server sent back an invalid card.')
  return card
}

export async function rejectSubmission(password: string, id: string): Promise<void> {
  await graphqlRequest('mutation ($id: ID!) { rejectSubmission(id: $id) }', { password, variables: { id } })
}

/** Returns how many cards were added to the deck. */
export async function approveAllSubmissions(password: string): Promise<number> {
  const data = await graphqlRequest('mutation { approveAllSubmissions }', { password })
  return typeof data.approveAllSubmissions === 'number' ? data.approveAllSubmissions : 0
}
