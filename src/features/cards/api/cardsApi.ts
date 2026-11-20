import { graphqlRequest } from '../../../lib/graphql'
import type { Category, Prompt } from '../../game/types/game.types'
import { parseApiCard, parseApiCards, toApiCategory } from '../utils/cardParsing'

export interface CardDraft {
  category: Category
  text: string
  spicy: boolean
}

const CARD_FIELDS = 'id category text spicy'

function requireCard(data: Record<string, unknown>, key: string): Prompt {
  const card = parseApiCard(data[key])
  if (!card) throw new Error('The server sent back an invalid card.')
  return card
}

/** Public: the game and the admin page both load cards this way. */
export async function fetchCards(signal?: AbortSignal): Promise<Prompt[]> {
  const data = await graphqlRequest(`query { cards { ${CARD_FIELDS} } }`, signal ? { signal } : {})
  return parseApiCards(data.cards)
}

/** Throws a GraphQLRequestError('unauthorized') when the password is wrong. */
export async function verifyAdminPassword(password: string): Promise<void> {
  await graphqlRequest('query { adminCheck }', { password })
}

export async function createCard(password: string, draft: CardDraft): Promise<Prompt> {
  const data = await graphqlRequest(
    `mutation ($input: CreateCardInput!) { createCard(input: $input) { ${CARD_FIELDS} } }`,
    {
      password,
      variables: { input: { ...draft, category: toApiCategory(draft.category) } },
    },
  )
  return requireCard(data, 'createCard')
}

export async function updateCard(password: string, id: string, draft: CardDraft): Promise<Prompt> {
  const data = await graphqlRequest(
    `mutation ($id: ID!, $input: UpdateCardInput!) { updateCard(id: $id, input: $input) { ${CARD_FIELDS} } }`,
    {
      password,
      variables: { id, input: { ...draft, category: toApiCategory(draft.category) } },
    },
  )
  return requireCard(data, 'updateCard')
}

export async function deleteCard(password: string, id: string): Promise<void> {
  await graphqlRequest(`mutation ($id: ID!) { deleteCard(id: $id) { id } }`, {
    password,
    variables: { id },
  })
}
