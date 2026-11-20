import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { AppConfig } from '../config/env.validation';
import { Prisma } from '../generated/prisma/client';
import type { Player } from '../generated/prisma/client';
import { DeathReason, EventKind, LifeStatus, Role, VoteStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { JoinPartyInput } from './assassin.inputs';
import type {
  AdminPlayer,
  AssassinState,
  GameEventModel,
  PartyStats,
  PublicPlayer,
  VoteInfo,
} from './assassin.models';
import { GameClock, GameRandom } from './game-runtime';

type Tx = Prisma.TransactionClient;

/** One assassin for every group of this many guests. */
export const BATCH_SIZE = 7;
export const MAX_PLAYERS = 150;
const FEED_LENGTH = 40;

@Injectable()
export class AssassinService {
  private readonly cooldownMinutes: number;
  private readonly voteSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppConfig, true>,
    private readonly clock: GameClock,
    private readonly random: GameRandom,
  ) {
    this.cooldownMinutes = config.get('ASSASSIN_COOLDOWN_MINUTES', { infer: true });
    this.voteSeconds = config.get('VOTE_SECONDS', { infer: true });
  }

  // ---------------------------------------------------------------------------
  // Joining and roles
  // ---------------------------------------------------------------------------

  /** Signs a guest in and decides right away whether they are an assassin. */
  async join(input: JoinPartyInput): Promise<{ token: string; playerId: string }> {
    const name = input.name;
    const nameKey = name.normalize('NFKC').toLowerCase();
    const token = randomBytes(24).toString('base64url');

    try {
      const player = await this.prisma.$transaction(async (tx) => {
        const now = this.clock.now();
        if ((await tx.player.count()) >= MAX_PLAYERS) throw new BadRequestException('The party is full.');
        if (await tx.player.findUnique({ where: { nameKey } })) {
          throw new BadRequestException('Someone already has that name. Add an initial or a nickname.');
        }

        const batches = await tx.partyBatch.findMany({
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: { _count: { select: { players: true } } },
        });
        let batch = batches.find((candidate) => candidate._count.players < BATCH_SIZE);
        let size = batch?._count.players ?? 0;
        if (!batch) {
          const created = await tx.partyBatch.create({ data: { assassinSlot: 0, createdAt: now } });
          batch = { ...created, _count: { players: 0 } };
          size = 0;
        }

        // Every group needs one assassin. A guest who joins a group that has none yet gets the role with
        // chance 1 in (seats left), so each seat is equally likely and the last seat is certain.
        // This looks at who is actually in the group, so people leaving or being removed never skews it.
        const hasAssassin = (await tx.player.count({ where: { batchId: batch.id, role: Role.ASSASSIN } })) > 0;
        const seatsLeft = BATCH_SIZE - size;
        const isAssassin =
          batch.assassinPending || (!hasAssassin && (seatsLeft === 1 || this.random.int(seatsLeft) === 0));
        if (batch.assassinPending && isAssassin) {
          await tx.partyBatch.update({ where: { id: batch.id }, data: { assassinPending: false } });
        }
        const position = size + 1;

        const created = await tx.player.create({
          data: {
            name,
            nameKey,
            token,
            batchId: batch.id,
            position,
            role: isAssassin ? Role.ASSASSIN : Role.INNOCENT,
            nextKillAt: isAssassin ? this.cooldownEnd(now) : null,
            createdAt: now,
          },
        });
        await this.addEvent(tx, EventKind.JOINED, `${name} joined the party.`);
        return created;
      });
      return { token, playerId: player.id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Someone already has that name. Add an initial or a nickname.');
      }
      throw error;
    }
  }

  /** An assassin can say "no thanks" until their first kill; the role then moves on. */
  async declineAssassin(meId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const me = await this.requirePlayer(tx, meId);
      if (me.role !== Role.ASSASSIN) throw new BadRequestException('You are not an assassin.');
      if (me.status !== LifeStatus.ALIVE) throw new BadRequestException('Too late for that now.');
      if ((await tx.player.count({ where: { killedById: me.id } })) > 0) {
        throw new BadRequestException('You already made a kill, so there is no backing out.');
      }

      const now = this.clock.now();
      await tx.player.update({
        where: { id: me.id },
        data: { role: Role.INNOCENT, declinedAssassin: true, nextKillAt: null },
      });

      const candidates = await tx.player.findMany({
        where: {
          batchId: me.batchId,
          id: { not: me.id },
          role: Role.INNOCENT,
          declinedAssassin: false,
          status: LifeStatus.ALIVE,
          present: true,
        },
      });
      const next = candidates.length > 0 ? candidates[this.random.int(candidates.length)] : undefined;
      if (next) {
        await tx.player.update({
          where: { id: next.id },
          data: { role: Role.ASSASSIN, nextKillAt: this.cooldownEnd(now) },
        });
        await this.addEvent(
          tx,
          EventKind.ROLE_ASSIGNED,
          'You have been chosen as an assassin. You can say no thanks until your first kill.',
          next.id,
        );
      } else {
        // Nobody to hand it to yet: the next guest in this group gets the role.
        await tx.partyBatch.update({ where: { id: me.batchId }, data: { assassinPending: true } });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Kills
  // ---------------------------------------------------------------------------

  async assassinate(meId: string, targetId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = this.clock.now();
      const me = await this.requirePlayer(tx, meId);
      if (me.role !== Role.ASSASSIN) throw new BadRequestException('Only assassins can do that.');
      if (me.status !== LifeStatus.ALIVE) throw new BadRequestException('Dead assassins tell no tales.');
      if (!me.present) throw new BadRequestException('Mark yourself as back at the party first.');
      if (me.nextKillAt && me.nextKillAt.getTime() > now.getTime()) {
        const seconds = Math.ceil((me.nextKillAt.getTime() - now.getTime()) / 1000);
        throw new BadRequestException(`You can't strike yet. ${formatWait(seconds)} to go.`);
      }

      if (targetId === me.id) throw new BadRequestException('Not that kind of assassin.');
      const target = await tx.player.findUnique({ where: { id: targetId } });
      if (!target) throw new BadRequestException('That guest is gone.');
      if (target.role === Role.ASSASSIN) throw new BadRequestException('You cannot target a fellow assassin.');
      if (target.status !== LifeStatus.ALIVE) throw new BadRequestException(`${target.name} is already dead.`);
      if (!target.present) throw new BadRequestException(`${target.name} has left the party.`);

      await tx.player.update({
        where: { id: target.id },
        data: {
          status: LifeStatus.DEAD,
          deathReason: DeathReason.ASSASSINATED,
          diedAt: now,
          killedById: me.id,
        },
      });
      await tx.player.update({ where: { id: me.id }, data: { nextKillAt: this.cooldownEnd(now) } });

      await this.addEvent(tx, EventKind.KILLED, `${target.name} was assassinated.`);
      await this.addEvent(
        tx,
        EventKind.KILLED,
        'You have been assassinated! Time for a dramatic death, wherever you are.',
        target.id,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Leaving and returning
  // ---------------------------------------------------------------------------

  async setPresent(meId: string, present: boolean): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const me = await this.requirePlayer(tx, meId);
      if (me.present === present) return;
      await tx.player.update({ where: { id: me.id }, data: { present } });
      await this.addEvent(
        tx,
        present ? EventKind.RETURNED : EventKind.LEFT,
        present ? `${me.name} is back at the party.` : `${me.name} left the party.`,
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------

  async startVote(meId: string): Promise<void> {
    await this.resolveExpiredVotes();
    await this.prisma.$transaction(async (tx) => {
      const me = await this.requirePlayer(tx, meId);
      this.assertCanVote(me);
      if (await tx.vote.findFirst({ where: { status: VoteStatus.OPEN } })) {
        throw new BadRequestException('A vote is already happening. Join it!');
      }
      const now = this.clock.now();
      await tx.vote.create({
        data: {
          startedById: me.id,
          startedAt: now,
          endsAt: new Date(now.getTime() + this.voteSeconds * 1000),
        },
      });
      await this.addEvent(
        tx,
        EventKind.VOTE_STARTED,
        `${me.name} called a vote! Living guests, pick who you think is an assassin.`,
      );
    });
  }

  async castVote(meId: string, voteId: string, candidateId: string): Promise<void> {
    await this.resolveExpiredVotes();
    await this.prisma.$transaction(async (tx) => {
      const me = await this.requirePlayer(tx, meId);
      this.assertCanVote(me);
      const vote = await tx.vote.findUnique({ where: { id: voteId } });
      if (!vote || vote.status !== VoteStatus.OPEN) throw new BadRequestException('That vote has ended.');
      if (candidateId === me.id) throw new BadRequestException('You cannot vote for yourself.');
      const candidate = await tx.player.findUnique({ where: { id: candidateId } });
      if (!candidate || candidate.status !== LifeStatus.ALIVE || !candidate.present) {
        throw new BadRequestException('You can only vote for living guests who are still here.');
      }

      await tx.ballot.upsert({
        where: { voteId_voterId: { voteId, voterId: me.id } },
        create: { voteId, voterId: me.id, candidateId, createdAt: this.clock.now() },
        update: { candidateId },
      });

      // Once every living guest has voted there is nothing left to wait for.
      const eligible = await tx.player.count({ where: { status: LifeStatus.ALIVE, present: true } });
      const cast = await tx.ballot.count({ where: { voteId } });
      if (cast >= eligible) await this.finishVote(tx, voteId);
    });
  }

  /** The caller of a vote may end it early. */
  async endVote(meId: string): Promise<void> {
    await this.resolveExpiredVotes();
    await this.prisma.$transaction(async (tx) => {
      const vote = await tx.vote.findFirst({ where: { status: VoteStatus.OPEN } });
      if (!vote) return;
      if (vote.startedById !== meId) throw new BadRequestException('Only the person who called the vote can end it early.');
      await this.finishVote(tx, vote.id);
    });
  }

  /** Votes close themselves when time runs out; this is checked whenever anyone asks. */
  async resolveExpiredVotes(): Promise<void> {
    const now = this.clock.now();
    const expired = await this.prisma.vote.findMany({
      where: { status: VoteStatus.OPEN, endsAt: { lte: now } },
      select: { id: true },
    });
    for (const { id } of expired) {
      await this.prisma.$transaction((tx) => this.finishVote(tx, id));
    }
  }

  private async finishVote(tx: Tx, voteId: string): Promise<void> {
    const now = this.clock.now();
    // Whoever flips OPEN to CLOSED first owns the result; a second request does nothing.
    const claimed = await tx.vote.updateMany({
      where: { id: voteId, status: VoteStatus.OPEN },
      data: { status: VoteStatus.CLOSED, closedAt: now },
    });
    if (claimed.count === 0) return;

    const ballots = await tx.ballot.findMany({ where: { voteId } });
    const tally = new Map<string, number>();
    for (const ballot of ballots) tally.set(ballot.candidateId, (tally.get(ballot.candidateId) ?? 0) + 1);

    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    const runnerUp = ranked[1];
    const hasWinner =
      top !== undefined &&
      top[1] >= 2 &&
      top[1] * 2 > ballots.length &&
      (runnerUp === undefined || runnerUp[1] < top[1]);

    if (!hasWinner || !top) {
      await this.addEvent(
        tx,
        EventKind.VOTE_RESULT,
        ballots.length === 0
          ? 'The vote ended with no votes. Nobody was eliminated.'
          : 'The vote ended without a majority. Nobody was eliminated.',
      );
      return;
    }

    const accused = await tx.player.findUnique({ where: { id: top[0] } });
    if (!accused || accused.status !== LifeStatus.ALIVE) {
      await this.addEvent(tx, EventKind.VOTE_RESULT, 'The vote ended. Nobody was eliminated.');
      return;
    }

    await tx.player.update({
      where: { id: accused.id },
      data: { status: LifeStatus.DEAD, deathReason: DeathReason.VOTED_OUT, diedAt: now },
    });
    await tx.vote.update({ where: { id: voteId }, data: { eliminatedId: accused.id } });
    const reveal = accused.role === Role.ASSASSIN ? 'an ASSASSIN' : 'innocent';
    await this.addEvent(
      tx,
      EventKind.VOTE_RESULT,
      `${accused.name} was voted out with ${top[1]} of ${ballots.length} votes. They were ${reveal}.`,
    );
    await this.addEvent(
      tx,
      EventKind.VOTE_RESULT,
      'You were voted out! Make your exit as dramatic as you like.',
      accused.id,
    );
  }

  // ---------------------------------------------------------------------------
  // What a guest is allowed to see
  // ---------------------------------------------------------------------------

  async buildState(playerId: string): Promise<AssassinState> {
    await this.resolveExpiredVotes();
    const now = this.clock.now();

    const players = await this.prisma.player.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    const me = players.find((player) => player.id === playerId);
    if (!me) throw new UnauthorizedException('We lost track of you. Join the party again.');

    const openVote = await this.prisma.vote.findFirst({
      where: { status: VoteStatus.OPEN },
      include: { startedBy: true, ballots: true },
    });
    const events = await this.prisma.gameEvent.findMany({
      where: { OR: [{ audienceId: null }, { audienceId: me.id }] },
      orderBy: { id: 'desc' },
      take: FEED_LENGTH,
    });

    const isAssassin = me.role === Role.ASSASSIN;
    const hasKilled = players.some((player) => player.killedById === me.id);
    const eligibleVoters = players.filter((p) => p.status === LifeStatus.ALIVE && p.present).length;

    const vote: VoteInfo | null = openVote
      ? {
          id: openVote.id,
          startedByName: openVote.startedBy.name,
          startedAt: openVote.startedAt,
          endsAt: openVote.endsAt,
          ballotsCast: openVote.ballots.length,
          eligibleVoters,
          myCandidateId: openVote.ballots.find((ballot) => ballot.voterId === me.id)?.candidateId ?? null,
          startedByMe: openVote.startedById === me.id,
        }
      : null;

    return {
      me: {
        id: me.id,
        name: me.name,
        role: me.role,
        status: me.status,
        present: me.present,
        deathReason: me.deathReason,
        nextKillAt: isAssassin ? me.nextKillAt : null,
        canDecline: isAssassin && me.status === LifeStatus.ALIVE && !hasKilled,
        declinedAssassin: me.declinedAssassin,
        partners: isAssassin
          ? players.filter((p) => p.role === Role.ASSASSIN && p.id !== me.id).map(toPublicPlayer)
          : [],
      },
      players: players.map(toPublicPlayer),
      vote,
      events: events.map(
        (event): GameEventModel => ({
          id: event.id,
          kind: event.kind,
          message: event.message,
          createdAt: event.createdAt,
          isPrivate: event.audienceId !== null,
        }),
      ),
      stats: computeStats(players),
      serverTime: now,
      cooldownMinutes: this.cooldownMinutes,
    };
  }

  // ---------------------------------------------------------------------------
  // Host tools
  // ---------------------------------------------------------------------------

  async adminPlayers(): Promise<AdminPlayer[]> {
    const batches = await this.prisma.partyBatch.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    const groupOf = new Map(batches.map((batch, index) => [batch.id, index + 1]));
    const players = await this.prisma.player.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    return players.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.role,
      status: player.status,
      present: player.present,
      deathReason: player.deathReason,
      group: groupOf.get(player.batchId) ?? 0,
      nextKillAt: player.nextKillAt,
    }));
  }

  async adminSetStatus(playerId: string, status: LifeStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const player = await this.requirePlayer(tx, playerId);
      if (player.status === status) return;
      const now = this.clock.now();
      if (status === LifeStatus.DEAD) {
        await tx.player.update({
          where: { id: player.id },
          data: { status, deathReason: DeathReason.HOST, diedAt: now },
        });
        await this.addEvent(tx, EventKind.HOST, `${player.name} was eliminated by the host.`);
      } else {
        await tx.player.update({
          where: { id: player.id },
          data: {
            status,
            deathReason: null,
            diedAt: null,
            killedById: null,
            nextKillAt: player.role === Role.ASSASSIN ? this.cooldownEnd(now) : null,
          },
        });
        await this.addEvent(tx, EventKind.HOST, `${player.name} is back from the dead.`);
      }
    });
  }

  async adminSetRole(playerId: string, role: Role): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const player = await this.requirePlayer(tx, playerId);
      if (player.role === role) return;
      await tx.player.update({
        where: { id: player.id },
        data: {
          role,
          nextKillAt: role === Role.ASSASSIN ? this.cooldownEnd(this.clock.now()) : null,
        },
      });
      await this.addEvent(tx, EventKind.ROLE_ASSIGNED, 'The host changed your role. Check your card.', player.id);
    });
  }

  async adminRemovePlayer(playerId: string): Promise<void> {
    await this.prisma.player.deleteMany({ where: { id: playerId } });
  }

  async adminEndVote(): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const vote = await tx.vote.findFirst({ where: { status: VoteStatus.OPEN } });
      if (vote) await this.finishVote(tx, vote.id);
    });
  }

  /** Starts a brand-new game: every guest, vote and notice is wiped. */
  async adminReset(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.gameEvent.deleteMany(),
      this.prisma.ballot.deleteMany(),
      this.prisma.vote.deleteMany(),
      this.prisma.player.deleteMany(),
      this.prisma.partyBatch.deleteMany(),
    ]);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private cooldownEnd(from: Date): Date {
    return new Date(from.getTime() + this.cooldownMinutes * 60_000);
  }

  private async requirePlayer(tx: Tx, id: string): Promise<Player> {
    const player = await tx.player.findUnique({ where: { id } });
    if (!player) throw new UnauthorizedException('We lost track of you. Join the party again.');
    return player;
  }

  private assertCanVote(player: Player): void {
    if (player.status !== LifeStatus.ALIVE) throw new BadRequestException('Dead guests cannot vote.');
    if (!player.present) throw new BadRequestException('Mark yourself as back at the party first.');
  }

  private async addEvent(tx: Tx, kind: EventKind, message: string, audienceId?: string): Promise<void> {
    await tx.gameEvent.create({
      data: { kind, message, audienceId: audienceId ?? null, createdAt: this.clock.now() },
    });
  }
}

function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    status: player.status,
    present: player.present,
    deathReason: player.deathReason,
    revealedRole: player.deathReason === DeathReason.VOTED_OUT ? player.role : null,
  };
}

function computeStats(players: Player[]): PartyStats {
  const alive = players.filter((p) => p.status === LifeStatus.ALIVE);
  return {
    total: players.length,
    alive: alive.filter((p) => p.present).length,
    dead: players.length - alive.length,
    away: alive.filter((p) => !p.present).length,
    assassinsAlive: alive.filter((p) => p.present && p.role === Role.ASSASSIN).length,
  };
}

function formatWait(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
