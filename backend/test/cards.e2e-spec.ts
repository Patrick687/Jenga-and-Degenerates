import request from 'supertest';
import { LoginAttemptLimiter } from '../src/auth/login-attempt-limiter';
import { ADMIN_PASSWORD, createTestApp, TestApp } from './test-app';

const CREATE = `mutation ($input: CreateCardInput!) {
  createCard(input: $input) { id category text spicy createdAt updatedAt }
}`;
const UPDATE = `mutation ($id: ID!, $input: UpdateCardInput!) {
  updateCard(id: $id, input: $input) { id category text spicy }
}`;
const DELETE = `mutation ($id: ID!) { deleteCard(id: $id) { id text } }`;
const LIST = `query ($category: CardCategory, $spicy: Boolean) {
  cards(category: $category, spicy: $spicy) { id category text spicy }
}`;

describe('Cards API', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const create = (text: string, category = 'TRUTH', spicy = false) =>
    t.gql(CREATE, { input: { category, text, spicy } }, ADMIN_PASSWORD);

  describe('reading (public)', () => {
    it('lists cards without a password', async () => {
      const res = await t.gql(LIST);
      expect(res.errors).toBeUndefined();
      expect(Array.isArray(res.data?.cards)).toBe(true);
    });

    it('filters by category and spicy', async () => {
      await create('Filter test truth card', 'TRUTH', false);
      await create('Filter test dare card', 'DARE', true);

      const dares = await t.gql(LIST, { category: 'DARE' });
      expect(dares.data?.cards.every((c: { category: string }) => c.category === 'DARE')).toBe(true);
      expect(dares.data?.cards.map((c: { text: string }) => c.text)).toContain('Filter test dare card');

      const spicy = await t.gql(LIST, { spicy: true });
      expect(spicy.data?.cards.every((c: { spicy: boolean }) => c.spicy)).toBe(true);

      const mild = await t.gql(LIST, { spicy: false });
      expect(mild.data?.cards.some((c: { spicy: boolean }) => c.spicy)).toBe(false);
    });

    it('serves a health check with the card count', async () => {
      const res = await request(t.app.getHttpServer()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.cards).toBe('number');
    });
  });

  describe('creating', () => {
    it('creates a card and returns it', async () => {
      const res = await create('Create test card', 'CHAOS', true);
      expect(res.errors).toBeUndefined();
      expect(res.data?.createCard).toMatchObject({
        category: 'CHAOS',
        text: 'Create test card',
        spicy: true,
      });
      expect(res.data?.createCard.id).toEqual(expect.any(String));
    });

    it('defaults spicy to false', async () => {
      const res = await t.gql(
        CREATE,
        { input: { category: 'DARE', text: 'Default spicy card' } },
        ADMIN_PASSWORD,
      );
      expect(res.data?.createCard.spicy).toBe(false);
    });

    it('trims whitespace from the text', async () => {
      const res = await create('   Padded text card   ');
      expect(res.data?.createCard.text).toBe('Padded text card');
    });

    it.each([
      ['empty text', ''],
      ['whitespace-only text', '     '],
      ['too-long text', 'x'.repeat(161)],
    ])('rejects %s', async (_label, text) => {
      const res = await create(text);
      expect(res.data).toBeNull();
      expect(res.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
    });

    it('rejects an unknown category', async () => {
      const res = await create('Bad category card', 'NOPE');
      expect(res.errors).toBeDefined();
      expect(res.data).toBeNull();
    });
  });

  describe('updating', () => {
    it('updates only the fields provided', async () => {
      const created = (await create('Before update', 'TRUTH', false)).data?.createCard;
      const res = await t.gql(
        UPDATE,
        { id: created.id, input: { text: 'After update', spicy: true } },
        ADMIN_PASSWORD,
      );
      expect(res.errors).toBeUndefined();
      expect(res.data?.updateCard).toEqual({
        id: created.id,
        category: 'TRUTH',
        text: 'After update',
        spicy: true,
      });
    });

    it('can move a card to another category', async () => {
      const created = (await create('Move me', 'TRUTH')).data?.createCard;
      const res = await t.gql(UPDATE, { id: created.id, input: { category: 'CHAOS' } }, ADMIN_PASSWORD);
      expect(res.data?.updateCard.category).toBe('CHAOS');
    });

    it('rejects invalid text on update', async () => {
      const created = (await create('Valid until updated')).data?.createCard;
      const res = await t.gql(UPDATE, { id: created.id, input: { text: ' ' } }, ADMIN_PASSWORD);
      expect(res.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
    });

    it('returns not found for an unknown id', async () => {
      const res = await t.gql(UPDATE, { id: 'nope', input: { text: 'Whatever text' } }, ADMIN_PASSWORD);
      expect(res.errors?.[0]?.message).toMatch(/not found/i);
    });
  });

  describe('deleting', () => {
    it('removes the card', async () => {
      const created = (await create('Delete me')).data?.createCard;
      const res = await t.gql(DELETE, { id: created.id }, ADMIN_PASSWORD);
      expect(res.data?.deleteCard).toEqual({ id: created.id, text: 'Delete me' });

      const list = await t.gql(LIST);
      expect(list.data?.cards.map((c: { id: string }) => c.id)).not.toContain(created.id);
    });

    it('returns not found when deleting twice', async () => {
      const created = (await create('Delete me twice')).data?.createCard;
      await t.gql(DELETE, { id: created.id }, ADMIN_PASSWORD);
      const again = await t.gql(DELETE, { id: created.id }, ADMIN_PASSWORD);
      expect(again.errors?.[0]?.message).toMatch(/not found/i);
    });
  });

  describe('admin protection', () => {
    it('blocks every mutation without a password', async () => {
      const created = (await create('Protected card')).data?.createCard;
      const attempts = await Promise.all([
        t.gql(CREATE, { input: { category: 'TRUTH', text: 'No password card' } }),
        t.gql(UPDATE, { id: created.id, input: { text: 'Hacked text' } }),
        t.gql(DELETE, { id: created.id }),
      ]);
      for (const res of attempts) {
        expect(res.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
        expect(res.data).toBeNull();
      }
      const list = await t.gql(LIST);
      const card = list.data?.cards.find((c: { id: string }) => c.id === created.id);
      expect(card?.text).toBe('Protected card');
    });

    it('rejects a wrong password', async () => {
      const res = await t.gql(CREATE, { input: { category: 'TRUTH', text: 'Wrong password' } }, 'nope-nope');
      expect(res.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('adminCheck confirms a good password and rejects a missing one', async () => {
      const ok = await t.gql('{ adminCheck }', undefined, ADMIN_PASSWORD);
      expect(ok.data?.adminCheck).toBe(true);
      const missing = await t.gql('{ adminCheck }');
      expect(missing.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('locks out an IP after too many wrong passwords', async () => {
      const failures = LoginAttemptLimiter.MAX_FAILURES;
      for (let i = 0; i < failures; i += 1) {
        await t.gql('{ adminCheck }', undefined, `wrong-${i}`);
      }
      // Even the right password is refused while locked out.
      const locked = await t.gql('{ adminCheck }', undefined, ADMIN_PASSWORD);
      expect(locked.errors?.[0]?.message).toMatch(/too many/i);
    });
  });
});
