import { SubmissionRateLimiter } from '../src/cards/submission-rate-limiter';
import { ADMIN_PASSWORD, createTestApp, TestApp } from './test-app';

const SUBMIT = `mutation ($input: SubmitCardInput!) { submitCard(input: $input) }`;
const CARDS = `query { cards { category text spicy } }`;

describe('Guest card submissions', () => {
  let t: TestApp;
  let n = 0;
  const unique = () => `Guest card number ${(n += 1)} for the deck`;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const submit = (over: Record<string, unknown> = {}) =>
    t.gql(SUBMIT, { input: { category: 'TRUTH', text: unique(), spicy: false, ...over } });
  const deck = async () => (await t.gql(CARDS)).data?.cards as Array<{ category: string; text: string; spicy: boolean }>;

  it('adds a card to the deck with no password', async () => {
    const res = await submit({ category: 'DARE', text: '  Do   your best   walk ', spicy: true });
    expect(res.errors).toBeUndefined();
    expect(res.data?.submitCard).toBe(true);
    expect(await deck()).toContainEqual({ category: 'DARE', text: 'Do your best walk', spicy: true });
  });

  it('rejects text that is too short or too long', async () => {
    expect((await submit({ text: 'hi' })).errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect((await submit({ text: 'x'.repeat(161) })).errors?.[0].extensions?.code).toBe('BAD_REQUEST');
  });

  it('blocks duplicates of cards in the deck, ignoring case and spacing', async () => {
    await submit({ text: 'Duplicate me please' });
    const again = await submit({ text: '  DUPLICATE   me please ' });
    expect(again.errors?.[0].message).toMatch(/already in the deck/i);
  });

  it('also blocks copies of cards the host added', async () => {
    await t.gql(
      `mutation ($input: CreateCardInput!) { createCard(input: $input) { id } }`,
      { input: { category: 'TRUTH', text: 'Host made card', spicy: false } },
      ADMIN_PASSWORD,
    );
    expect((await submit({ text: 'host made card' })).errors?.[0].message).toMatch(/already in the deck/i);
  });

  it('rate limits a flood from one address', async () => {
    let last = await submit();
    for (let i = 0; i < SubmissionRateLimiter.MAX_PER_WINDOW + 2 && !last.errors; i += 1) {
      last = await submit();
    }
    expect(last.errors?.[0].message).toMatch(/lot of suggestions/i);
  });
});
