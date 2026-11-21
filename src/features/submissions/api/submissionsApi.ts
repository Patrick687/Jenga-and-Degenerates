import { graphqlRequest } from '../../../lib/graphql'
import type { CardDraft } from '../../cards/api/cardsApi'
import { toApiCategory } from '../../cards/utils/cardParsing'

/** Public: any guest can add a card. It goes straight into the deck. */
export async function submitCard(draft: CardDraft): Promise<void> {
  await graphqlRequest(`mutation ($input: SubmitCardInput!) { submitCard(input: $input) }`, {
    variables: { input: { category: toApiCategory(draft.category), text: draft.text, spicy: draft.spicy } },
  })
}
