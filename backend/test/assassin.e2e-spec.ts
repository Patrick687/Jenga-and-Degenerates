import { ADMIN_PASSWORD, createTestApp, TestApp } from './test-app';

const STATE = `
  me { id name role status present nextKillAt canDecline declinedAssassin partners { id name status } }
  players { id name status present deathReason revealedRole }
  vote { id startedByName ballotsCast eligibleVoters myCandidateId startedByMe }
  events { id kind message isPrivate }
  stats { total alive dead away assassinsAlive }
  cooldownMinutes
`;

const JOIN = `mutation ($name: String!) { joinParty(input: { name: $name }) { token state { ${STATE} } } }`;
const STATE_QUERY = `query { assassinState { ${STATE} } }`;
const KILL = `mutation ($id: ID!) { assassinate(targetId: $id) { ${STATE} } }`;
const DECLINE = `mutation { declineAssassin { ${STATE} } }`;
const LEAVE = `mutation { leaveParty { ${STATE} } }`;
const RETURN = `mutation { returnToParty { ${STATE} } }`;
const START_VOTE = `mutation { startVote { ${STATE} } }`;
const CAST = `mutation ($vote: ID!, $who: ID!) { castVote(voteId: $vote, candidateId: $who) { ${STATE} } }`;
const END_VOTE = `mutation { endVote { ${STATE} } }`;
const ADMIN_LIST = `query { adminAssassinPlayers { id name role status present deathReason group } }`;

interface Guest {
  name: string;
  token: string;
  id: string;
  role: string;
}

/**
 * Random draws that make the assassin land on a given seat (1-7) of a group.
 * Each guest joining a group without an assassin draws once; 0 means "you're the assassin",
 * and the last seat needs no draw because it is certain.
 */
const seatDraws = (slot: number): number[] => [...Array<number>(slot - 1).fill(1), ...(slot < 7 ? [0] : [])];

describe('Assassin game', () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await createTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  const as = (guest: Guest) => ({ 'x-player-token': guest.token });
  const ask = (guest: Guest, query: string, variables?: Record<string, unknown>) =>
    t.gql(query, variables, undefined, as(guest));

  async function join(name: string): Promise<Guest> {
    const res = await t.gql(JOIN, { name });
    expect(res.errors).toBeUndefined();
    const { token, state } = res.data!.joinParty;
    return { name, token, id: state.me.id, role: state.me.role };
  }

  /** Joins `count` guests. The first group's assassin lands on `slot` (1-7). */
  async function joinMany(count: number, slot = 3, prefix = 'Guest'): Promise<Guest[]> {
    t.random.queue(...seatDraws(slot));
    const guests: Guest[] = [];
    for (let i = 1; i <= count; i += 1) guests.push(await join(`${prefix} ${i}`));
    return guests;
  }

  const state = async (guest: Guest) => (await ask(guest, STATE_QUERY)).data!.assassinState;

  describe('joining and roles', () => {
    it('gives exactly one assassin per group of 7, decided at sign-up', async () => {
      t.random.queue(...seatDraws(3), ...seatDraws(7)); // group 1 seat 3, group 2 seat 7
      const guests: Guest[] = [];
      for (let i = 1; i <= 14; i += 1) guests.push(await join(`Guest ${i}`));

      expect(guests.filter((g) => g.role === 'ASSASSIN').map((g) => g.name)).toEqual(['Guest 3', 'Guest 14']);
      const admin = await t.gql(ADMIN_LIST, undefined, ADMIN_PASSWORD);
      const groups = new Set(admin.data!.adminAssassinPlayers.map((p: { group: number }) => p.group));
      expect(groups).toEqual(new Set([1, 2]));
    });

    it('starts a new group when the previous one is full', async () => {
      const guests = await joinMany(8);
      const admin = await t.gql(ADMIN_LIST, undefined, ADMIN_PASSWORD);
      const eighth = admin.data!.adminAssassinPlayers.find((p: { id: string }) => p.id === guests[7]!.id);
      expect(eighth.group).toBe(2);
    });

    it('rejects duplicate names regardless of case, and bad names', async () => {
      await join('Patrick');
      const dup = await t.gql(JOIN, { name: '  patrick ' });
      expect(dup.errors?.[0]?.message).toMatch(/already has that name/);
      const short = await t.gql(JOIN, { name: 'a' });
      expect(short.errors).toBeDefined();
    });

    it('requires a valid player token', async () => {
      const none = await t.gql(STATE_QUERY);
      expect(none.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      const bogus = await t.gql(STATE_QUERY, undefined, undefined, { 'x-player-token': 'nope' });
      expect(bogus.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('secrecy', () => {
    it('lets assassins see each other and nobody else', async () => {
      t.random.queue(...seatDraws(1), ...seatDraws(2)); // group 1 seat 1, group 2 seat 2
      const guests: Guest[] = [];
      for (let i = 1; i <= 9; i += 1) guests.push(await join(`Guest ${i}`));
      const [a, innocent, b] = [guests[0]!, guests[1]!, guests[8]!];
      expect([a.role, b.role, innocent.role]).toEqual(['ASSASSIN', 'ASSASSIN', 'INNOCENT']);

      expect((await state(a)).me.partners.map((p: { name: string }) => p.name)).toEqual(['Guest 9']);
      expect((await state(innocent)).me.partners).toEqual([]);
    });

    it('never exposes other guests roles in the public player list', async () => {
      const guests = await joinMany(7);
      const s = await state(guests[0]!);
      expect(s.players.every((p: { revealedRole: unknown }) => p.revealedRole === null)).toBe(true);

      const probe = await ask(guests[0]!, `query { assassinState { players { role } } }`);
      expect(probe.errors?.[0]?.message).toMatch(/Cannot query field "role"/);
    });

    it('keeps the host tools behind the admin password', async () => {
      expect((await t.gql(ADMIN_LIST)).errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      const guests = await joinMany(1);
      expect((await ask(guests[0]!, ADMIN_LIST)).errors).toBeDefined();
    });
  });

  describe('assassinations', () => {
    it('enforces the cooldown between kills', async () => {
      const guests = await joinMany(7); // Guest 3 is the assassin
      const assassin = guests[2]!;
      const [v1, v2] = [guests[0]!, guests[1]!];

      const early = await ask(assassin, KILL, { id: v1.id });
      expect(early.errors?.[0]?.message).toMatch(/can't strike yet/);

      t.clock.advanceMinutes(12);
      const first = await ask(assassin, KILL, { id: v1.id });
      expect(first.errors).toBeUndefined();
      expect(first.data!.assassinate.players.find((p: { id: string }) => p.id === v1.id).status).toBe('DEAD');

      const tooSoon = await ask(assassin, KILL, { id: v2.id });
      expect(tooSoon.errors?.[0]?.message).toMatch(/can't strike yet/);

      t.clock.advanceMinutes(11);
      expect((await ask(assassin, KILL, { id: v2.id })).errors?.[0]?.message).toMatch(/can't strike yet/);
      t.clock.advanceMinutes(1);
      expect((await ask(assassin, KILL, { id: v2.id })).errors).toBeUndefined();
    });

    it('tells everyone someone died, without saying who did it, and tells the victim privately', async () => {
      const guests = await joinMany(7);
      const [assassin, victim, bystander] = [guests[2]!, guests[0]!, guests[1]!];
      t.clock.advanceMinutes(12);
      await ask(assassin, KILL, { id: victim.id });

      const publicFeed = (await state(bystander)).events;
      expect(publicFeed.some((e: { message: string }) => e.message === 'Guest 1 was assassinated.')).toBe(true);
      expect(publicFeed.some((e: { isPrivate: boolean }) => e.isPrivate)).toBe(false);
      expect(JSON.stringify(publicFeed)).not.toContain('Guest 3 assassinated');

      const mine = (await state(victim)).events.filter((e: { isPrivate: boolean }) => e.isPrivate);
      expect(mine[0].message).toMatch(/dramatic death/);
      expect((await state(victim)).me.status).toBe('DEAD');
    });

    it('does not let assassins target each other, the dead, or people who left', async () => {
      t.random.queue(...seatDraws(1), ...seatDraws(2));
      const guests: Guest[] = [];
      for (let i = 1; i <= 9; i += 1) guests.push(await join(`Guest ${i}`));
      const [a, b, c, d] = [guests[0]!, guests[8]!, guests[1]!, guests[2]!];
      t.clock.advanceMinutes(12);

      expect((await ask(a, KILL, { id: b.id })).errors?.[0]?.message).toMatch(/fellow assassin/);
      expect((await ask(c, KILL, { id: d.id })).errors?.[0]?.message).toMatch(/Only assassins/);

      await ask(d, LEAVE);
      expect((await ask(a, KILL, { id: d.id })).errors?.[0]?.message).toMatch(/left the party/);

      expect((await ask(a, KILL, { id: c.id })).errors).toBeUndefined();
      t.clock.advanceMinutes(12);
      expect((await ask(a, KILL, { id: c.id })).errors?.[0]?.message).toMatch(/already dead/);
    });
  });

  describe('declining the role', () => {
    it('passes the role to another guest in the group', async () => {
      const guests = await joinMany(7); // Guest 3 is the assassin
      t.random.queue(0); // pick the first candidate
      const res = await ask(guests[2]!, DECLINE);
      expect(res.errors).toBeUndefined();
      expect(res.data!.declineAssassin.me.role).toBe('INNOCENT');
      expect(res.data!.declineAssassin.me.canDecline).toBe(false);

      const admin = await t.gql(ADMIN_LIST, undefined, ADMIN_PASSWORD);
      const assassins = admin.data!.adminAssassinPlayers.filter((p: { role: string }) => p.role === 'ASSASSIN');
      expect(assassins.map((p: { name: string }) => p.name)).toEqual(['Guest 1']);

      const chosen = await state(guests[0]!);
      expect(chosen.me.role).toBe('ASSASSIN');
      expect(chosen.events.some((e: { isPrivate: boolean; message: string }) => e.isPrivate && /chosen as an assassin/.test(e.message))).toBe(true);
    });

    it('hands the role to the next person to join when nobody else is there yet', async () => {
      const [solo] = await joinMany(1, 1);
      expect(solo!.role).toBe('ASSASSIN');
      await ask(solo!, DECLINE);

      const next = await join('Latecomer');
      expect(next.role).toBe('ASSASSIN');
      const after = await join('Another');
      expect(after.role).toBe('INNOCENT');
    });

    it('does not allow backing out after a kill', async () => {
      const guests = await joinMany(7);
      t.clock.advanceMinutes(12);
      await ask(guests[2]!, KILL, { id: guests[0]!.id });
      const res = await ask(guests[2]!, DECLINE);
      expect(res.errors?.[0]?.message).toMatch(/no backing out/);
    });

    it('is refused for innocents', async () => {
      const guests = await joinMany(2);
      expect((await ask(guests[0]!, DECLINE)).errors?.[0]?.message).toMatch(/not an assassin/);
    });
  });

  describe('leaving the party', () => {
    it('marks guests as away and back, with public notices', async () => {
      const guests = await joinMany(3);
      const left = await ask(guests[0]!, LEAVE);
      expect(left.data!.leaveParty.me.present).toBe(false);
      expect(left.data!.leaveParty.stats.away).toBe(1);

      const back = await ask(guests[0]!, RETURN);
      expect(back.data!.returnToParty.me.present).toBe(true);
      const messages = (await state(guests[1]!)).events.map((e: { message: string }) => e.message);
      expect(messages).toEqual(expect.arrayContaining(['Guest 1 left the party.', 'Guest 1 is back at the party.']));
    });

    it('stops an assassin who left from striking', async () => {
      const guests = await joinMany(7);
      t.clock.advanceMinutes(12);
      await ask(guests[2]!, LEAVE);
      const res = await ask(guests[2]!, KILL, { id: guests[0]!.id });
      expect(res.errors?.[0]?.message).toMatch(/back at the party/);
    });
  });

  describe('voting', () => {
    it('eliminates the majority pick and reveals their role', async () => {
      const guests = await joinMany(7); // Guest 3 assassin
      const [a, b, c, d] = [guests[0]!, guests[1]!, guests[3]!, guests[2]!];
      const started = await ask(a, START_VOTE);
      expect(started.errors).toBeUndefined();
      const voteId = started.data!.startVote.vote.id;
      expect((await ask(b, START_VOTE)).errors?.[0]?.message).toMatch(/already happening/);

      await ask(a, CAST, { vote: voteId, who: d.id });
      await ask(b, CAST, { vote: voteId, who: d.id });
      await ask(c, CAST, { vote: voteId, who: a.id });
      expect((await state(a)).vote.ballotsCast).toBe(3);
      expect((await state(a)).vote.myCandidateId).toBe(d.id);

      t.clock.advanceMinutes(3); // time runs out
      const after = await state(a);
      expect(after.vote).toBeNull();
      const accused = after.players.find((p: { id: string }) => p.id === d.id);
      expect(accused).toMatchObject({ status: 'DEAD', deathReason: 'VOTED_OUT', revealedRole: 'ASSASSIN' });
      expect(after.events.some((e: { message: string }) => /Guest 3 was voted out with 2 of 3 votes. They were an ASSASSIN/.test(e.message))).toBe(true);
    });

    it('eliminates nobody on a tie or when the pick is not a majority', async () => {
      const guests = await joinMany(4);
      const [a, b, c, d] = guests as [Guest, Guest, Guest, Guest];
      const voteId = (await ask(a, START_VOTE)).data!.startVote.vote.id;
      await ask(a, CAST, { vote: voteId, who: b.id });
      await ask(b, CAST, { vote: voteId, who: a.id });
      await ask(c, CAST, { vote: voteId, who: d.id });
      t.clock.advanceMinutes(3);
      const after = await state(a);
      expect(after.players.every((p: { status: string }) => p.status === 'ALIVE')).toBe(true);
      expect(after.events[0].message).toMatch(/without a majority/);
    });

    it('ends early once every living guest has voted', async () => {
      const guests = await joinMany(3);
      const [a, b, c] = guests as [Guest, Guest, Guest];
      const voteId = (await ask(a, START_VOTE)).data!.startVote.vote.id;
      await ask(a, CAST, { vote: voteId, who: c.id });
      await ask(b, CAST, { vote: voteId, who: c.id });
      const last = await ask(c, CAST, { vote: voteId, who: a.id });
      expect(last.data!.castVote.vote).toBeNull();
      expect(last.data!.castVote.players.find((p: { id: string }) => p.id === c.id).status).toBe('DEAD');
    });

    it('only lets the caller end it early, and blocks the dead and the absent from voting', async () => {
      const guests = await joinMany(7);
      const [a, b] = guests as [Guest, Guest];
      const c = guests[3]!; // not the assassin (Guest 3)
      await ask(a, START_VOTE);
      expect((await ask(b, END_VOTE)).errors?.[0]?.message).toMatch(/Only the person who called/);
      expect((await ask(a, END_VOTE)).errors).toBeUndefined();

      t.clock.advanceMinutes(12);
      await ask(guests[2]!, KILL, { id: c.id });
      expect((await ask(c, START_VOTE)).errors?.[0]?.message).toMatch(/Dead guests/);
      await ask(b, LEAVE);
      expect((await ask(b, START_VOTE)).errors?.[0]?.message).toMatch(/back at the party/);
    });

    it('cannot vote for yourself or a dead guest', async () => {
      const guests = await joinMany(4);
      const [a, b] = guests as [Guest, Guest];
      const voteId = (await ask(a, START_VOTE)).data!.startVote.vote.id;
      expect((await ask(a, CAST, { vote: voteId, who: a.id })).errors?.[0]?.message).toMatch(/yourself/);
      await t.gql(`mutation ($id: ID!) { adminSetPlayerStatus(id: $id, status: DEAD) }`, { id: b.id }, ADMIN_PASSWORD);
      expect((await ask(a, CAST, { vote: voteId, who: b.id })).errors?.[0]?.message).toMatch(/living guests/);
    });
  });

  describe('host tools', () => {
    it('revives, removes, changes roles, and resets', async () => {
      const guests = await joinMany(3);
      const [a, b] = guests as [Guest, Guest, Guest];
      const run = (query: string, variables?: Record<string, unknown>) => t.gql(query, variables, ADMIN_PASSWORD);

      await run(`mutation ($id: ID!) { adminSetPlayerStatus(id: $id, status: DEAD) }`, { id: a.id });
      expect((await state(b)).stats.dead).toBe(1);
      await run(`mutation ($id: ID!) { adminSetPlayerStatus(id: $id, status: ALIVE) }`, { id: a.id });
      expect((await state(b)).stats.dead).toBe(0);

      await run(`mutation ($id: ID!) { adminSetPlayerRole(id: $id, role: ASSASSIN) }`, { id: b.id });
      expect((await state(b)).me.role).toBe('ASSASSIN');

      await run(`mutation ($id: ID!) { adminRemovePlayer(id: $id) }`, { id: a.id });
      expect((await state(b)).stats.total).toBe(2);

      await run(`mutation { adminResetAssassin }`);
      const gone = await ask(b, STATE_QUERY);
      expect(gone.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      const list = await run(ADMIN_LIST);
      expect(list.data!.adminAssassinPlayers).toEqual([]);
    });
  });
});
