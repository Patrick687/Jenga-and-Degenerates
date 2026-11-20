import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DeathReason, EventKind, LifeStatus, Role } from '../generated/prisma/enums';

registerEnumType(Role, { name: 'PlayerRole' });
registerEnumType(LifeStatus, { name: 'LifeStatus' });
registerEnumType(DeathReason, { name: 'DeathReason' });
registerEnumType(EventKind, { name: 'EventKind' });

/** What every guest may know about every other guest. Never includes a role (unless revealed by a vote). */
@ObjectType()
export class PublicPlayer {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => LifeStatus) status!: LifeStatus;
  /** False once they have marked that they left the party. */
  @Field() present!: boolean;
  @Field(() => DeathReason, { nullable: true }) deathReason?: DeathReason | null;
  /** Only set for players who were voted out. */
  @Field(() => Role, { nullable: true }) revealedRole?: Role | null;
}

@ObjectType()
export class Me {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => Role) role!: Role;
  @Field(() => LifeStatus) status!: LifeStatus;
  @Field() present!: boolean;
  @Field(() => DeathReason, { nullable: true }) deathReason?: DeathReason | null;
  /** Assassins only: when they may strike next. */
  @Field(() => Date, { nullable: true }) nextKillAt?: Date | null;
  /** True while an assassin may still say "no thanks" (before their first kill). */
  @Field() canDecline!: boolean;
  @Field() declinedAssassin!: boolean;
  /** Assassins only: the other assassins. Empty for everyone else. */
  @Field(() => [PublicPlayer]) partners!: PublicPlayer[];
}

@ObjectType()
export class VoteInfo {
  @Field(() => ID) id!: string;
  @Field() startedByName!: string;
  @Field(() => Date) startedAt!: Date;
  @Field(() => Date) endsAt!: Date;
  @Field(() => Int) ballotsCast!: number;
  /** How many living guests at the party can vote. */
  @Field(() => Int) eligibleVoters!: number;
  @Field(() => ID, { nullable: true }) myCandidateId?: string | null;
  @Field() startedByMe!: boolean;
}

@ObjectType()
export class GameEventModel {
  @Field(() => Int) id!: number;
  @Field(() => EventKind) kind!: EventKind;
  @Field() message!: string;
  @Field(() => Date) createdAt!: Date;
  /** True if only this guest can see it. */
  @Field() isPrivate!: boolean;
}

@ObjectType()
export class PartyStats {
  @Field(() => Int) total!: number;
  @Field(() => Int) alive!: number;
  @Field(() => Int) dead!: number;
  /** Alive guests who marked that they left. */
  @Field(() => Int) away!: number;
  @Field(() => Int) assassinsAlive!: number;
}

@ObjectType()
export class AssassinState {
  @Field(() => Me) me!: Me;
  @Field(() => [PublicPlayer]) players!: PublicPlayer[];
  @Field(() => VoteInfo, { nullable: true }) vote?: VoteInfo | null;
  /** Newest first. */
  @Field(() => [GameEventModel]) events!: GameEventModel[];
  @Field(() => PartyStats) stats!: PartyStats;
  /** Server time, so phones with a wrong clock still show correct countdowns. */
  @Field(() => Date) serverTime!: Date;
  @Field(() => Int) cooldownMinutes!: number;
}

@ObjectType()
export class JoinResult {
  /** Keep this secret on the guest's device; it is how they are recognised. */
  @Field() token!: string;
  @Field(() => AssassinState) state!: AssassinState;
}

/** Host-only view that includes roles. */
@ObjectType()
export class AdminPlayer {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => Role) role!: Role;
  @Field(() => LifeStatus) status!: LifeStatus;
  @Field() present!: boolean;
  @Field(() => DeathReason, { nullable: true }) deathReason?: DeathReason | null;
  @Field(() => Int) group!: number;
  @Field(() => Date, { nullable: true }) nextKillAt?: Date | null;
}
