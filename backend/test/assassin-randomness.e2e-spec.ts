import { ADMIN_PASSWORD, createTestApp, TestApp } from './test-app';

const JOIN = `mutation ($name: String!) { joinParty(input: { name: $name }) { state { me { role } } } }`;
const LIST = `query { adminAssassinPlayers { name role group } }`;
const RESET = `mutation { adminResetAssassin }`;

/** Uses the real random generator (the other tests fix it) to check roles are really spread out. */
describe('Assassin role randomness (real random numbers)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp({ realRandom: true });
  });
  afterAll(async () => {
    await t.close();
  });

  it('puts exactly one assassin in every group of 7, in varied seats', async () => {
    const groups = 20;
    for (let i = 0; i < groups * 7; i += 1) {
      const res = await t.gql(JOIN, { name: `Guest ${i}` });
      expect(res.errors).toBeUndefined();
    }
    const players = (await t.gql(LIST, undefined, ADMIN_PASSWORD)).data!.adminAssassinPlayers as Array<{
      name: string;
      role: string;
      group: number;
    }>;

    const seats = new Set<number>();
    for (let group = 1; group <= groups; group += 1) {
      const members = players.filter((p) => p.group === group);
      expect(members).toHaveLength(7);
      const assassins = members.filter((p) => p.role === 'ASSASSIN');
      expect(assassins).toHaveLength(1);
      seats.add(members.findIndex((p) => p.role === 'ASSASSIN') + 1);
    }
    // Across 20 groups the assassin should turn up in many different seats.
    expect(seats.size).toBeGreaterThanOrEqual(4);
    await t.gql(RESET, undefined, ADMIN_PASSWORD);
  });

  it('sometimes makes the very first guest of a fresh game an assassin', async () => {
    let firstGuestAssassins = 0;
    const games = 70;
    for (let i = 0; i < games; i += 1) {
      await t.gql(RESET, undefined, ADMIN_PASSWORD);
      const res = await t.gql(JOIN, { name: 'First' });
      if (res.data!.joinParty.state.me.role === 'ASSASSIN') firstGuestAssassins += 1;
    }
    console.log(`First guest was the assassin in ${firstGuestAssassins} of ${games} fresh games (expect about ${games / 7})`);
    expect(firstGuestAssassins).toBeGreaterThan(0);
    expect(firstGuestAssassins).toBeLessThan(games / 2);
  });

  it('still gives a joiner a fair chance when they keep joining and being removed', async () => {
    // Joining, being removed and joining again used to put the same person in seat 1 of the same group forever.
    await t.gql(RESET, undefined, ADMIN_PASSWORD);
    let assassinTurns = 0;
    const tries = 120;
    for (let i = 0; i < tries; i += 1) {
      const res = await t.gql(`mutation ($name: String!) { joinParty(input: { name: $name }) { state { me { id role } } } }`, {
        name: 'Tester',
      });
      if (res.data!.joinParty.state.me.role === 'ASSASSIN') assassinTurns += 1;
      await t.gql(`mutation ($id: ID!) { adminRemovePlayer(id: $id) }`, { id: res.data!.joinParty.state.me.id }, ADMIN_PASSWORD);
    }
    console.log(`Assassin in ${assassinTurns} of ${tries} remove-and-rejoin attempts (expect about ${Math.round(tries / 7)})`);
    expect(assassinTurns).toBeGreaterThan(5);
    expect(assassinTurns).toBeLessThan(tries / 2);
  });
});
