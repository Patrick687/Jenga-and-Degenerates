import { SubmissionRateLimiter } from '../src/cards/submission-rate-limiter';
import { ADMIN_PASSWORD, createTestApp, TestApp } from './test-app';

const SUBMIT = `mutation ($input: SubmitCardInput!) { submitCard(input: $input) }`;
const PENDING = `query { adminCardSubmissions { id category text spicy submittedBy status } }`;
const APPROVE = `mutation ($id: ID!, $edits: UpdateCardInput) {
  approveSubmission(id: $id, edits: $edits) { id category text spicy }
}`;
const REJECT = `mutation ($id: ID!) { rejectSubmission(id: $id) }`;
const APPROVE_ALL = `mutation { approveAllSubmissions }`;
const CARDS = `query { cards { text } }`;

describe('Card submissions', () => {
  let t: TestApp;
  let n = 0;
  const unique = () => `Suggested card number ${(n += 1)} for the deck`;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const submit = (over: Record<string, unknown> = {}) =>
    t.gql(SUBMIT, { input: { category: 'TRUTH', text: unique(), spicy: false, ...over } });
  const pending = async () => (await t.gql(PENDING, undefined, ADMIN_PASSWORD)).data?.adminCardSubmissions ?? [];

  it('accepts a suggestion without any password', async () => {
    const res = await submit({ submittedBy: '  Sam  ' });
    expect(res.errors).toBeUndefined();
    expect(res.data?.submitCard).toBe(true);
    const list = await pending();
    expect(list.at(-1)).toMatchObject({ submittedBy: 'Sam', status: 'PENDING', spicy: false });
  });

  it('keeps the submitter optional', async () => {
    const res = await submit({ submittedBy: '   ' });
    expect(res.errors).toBeUndefined();
    expect((await pending()).at(-1).submittedBy).toBeNull();
  });

  it('rejects text that is too short or too long', async () => {
    const short = await submit({ text: 'hi' });
    expect(short.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    const long = await submit({ text: 'x'.repeat(161) });
    expect(long.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
  });

  it('rejects an overlong name', async () => {
    const res = await submit({ submittedBy: 'n'.repeat(25) });
    expect(res.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
  });

  it('blocks duplicates of pending suggestions, ignoring case and spacing', async () => {
    await submit({ text: 'Duplicate me please' });
    const again = await submit({ text: '  DUPLICATE   me please ' });
    expect(again.errors?.[0].message).toMatch(/already suggested/i);
  });

  it('blocks suggestions that are already in the deck', async () => {
    const text = 'A card that is already in the deck';
    await t.gql(
      `mutation ($input: CreateCardInput!) { createCard(input: $input) { id } }`,
      { input: { category: 'TRUTH', text, spicy: false } },
      ADMIN_PASSWORD,
    );
    const res = await submit({ text });
    expect(res.errors?.[0].message).toMatch(/already in the deck/i);
  });

  it('keeps the review queue admin-only', async () => {
    const none = await t.gql(PENDING);
    expect(none.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    const bad = await t.gql(APPROVE_ALL, undefined, 'wrong');
    expect(bad.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('approves a suggestion into the deck, with edits', async () => {
    await submit({ text: 'Original wording of a card', category: 'DARE', spicy: true });
    const target = (await pending()).find((s: { text: string }) => s.text === 'Original wording of a card');
    const res = await t.gql(
      APPROVE,
      { id: target.id, edits: { text: 'Edited wording of a card', spicy: false } },
      ADMIN_PASSWORD,
    );
    expect(res.errors).toBeUndefined();
    expect(res.data?.approveSubmission).toMatchObject({
      category: 'DARE',
      text: 'Edited wording of a card',
      spicy: false,
    });
    expect((await t.gql(CARDS)).data?.cards.map((c: { text: string }) => c.text)).toContain(
      'Edited wording of a card',
    );
    expect((await pending()).some((s: { id: string }) => s.id === target.id)).toBe(false);
    const again = await t.gql(APPROVE, { id: target.id }, ADMIN_PASSWORD);
    expect(again.errors?.[0].message).toMatch(/already handled/i);
  });

  it('rejects a suggestion without adding a card', async () => {
    await submit({ text: 'Reject this one right here' });
    const target = (await pending()).find((s: { text: string }) => s.text === 'Reject this one right here');
    const res = await t.gql(REJECT, { id: target.id }, ADMIN_PASSWORD);
    expect(res.data?.rejectSubmission).toBe(true);
    expect((await t.gql(CARDS)).data?.cards.map((c: { text: string }) => c.text)).not.toContain(
      'Reject this one right here',
    );
    expect((await t.gql(REJECT, { id: target.id }, ADMIN_PASSWORD)).errors?.[0].message).toMatch(/already handled/i);
  });

  it('reports unknown ids', async () => {
    const res = await t.gql(REJECT, { id: 'nope' }, ADMIN_PASSWORD);
    expect(res.errors?.[0].message).toMatch(/not found/i);
  });

  it('approves everything waiting and returns the count', async () => {
    const before = await pending();
    const res = await t.gql(APPROVE_ALL, undefined, ADMIN_PASSWORD);
    expect(res.data?.approveAllSubmissions).toBe(before.length);
    expect(await pending()).toHaveLength(0);
    expect((await t.gql(APPROVE_ALL, undefined, ADMIN_PASSWORD)).data?.approveAllSubmissions).toBe(0);
  });

  it('rate limits a flood from one address', async () => {
    let last = await submit();
    for (let i = 0; i < SubmissionRateLimiter.MAX_PER_WINDOW + 2 && !last.errors; i += 1) {
      last = await submit();
    }
    expect(last.errors?.[0].message).toMatch(/lot of suggestions/i);
  });
});
