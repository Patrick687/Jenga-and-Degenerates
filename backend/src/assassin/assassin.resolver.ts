import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminGuard } from '../auth/admin.guard';
import type { Player } from '../generated/prisma/client';
import { LifeStatus, Role } from '../generated/prisma/enums';
import { JoinPartyInput } from './assassin.inputs';
import { AdminPlayer, AssassinState, JoinResult } from './assassin.models';
import { AssassinService } from './assassin.service';
import { CurrentPlayer, PlayerGuard } from './player.guard';

/** Everything a guest can do, identified by their secret `X-Player-Token` header. */
@Resolver()
export class AssassinResolver {
  constructor(private readonly assassin: AssassinService) {}

  @Query(() => AssassinState, { description: 'Everything this guest is allowed to see.' })
  @UseGuards(PlayerGuard)
  assassinState(@CurrentPlayer() me: Player) {
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => JoinResult, { description: 'Sign in with a name. Public.' })
  async joinParty(@Args('input') input: JoinPartyInput): Promise<JoinResult> {
    const { token, playerId } = await this.assassin.join(input);
    return { token, state: await this.assassin.buildState(playerId) };
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async declineAssassin(@CurrentPlayer() me: Player) {
    await this.assassin.declineAssassin(me.id);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async assassinate(@CurrentPlayer() me: Player, @Args('targetId', { type: () => ID }) targetId: string) {
    await this.assassin.assassinate(me.id, targetId);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async leaveParty(@CurrentPlayer() me: Player) {
    await this.assassin.setPresent(me.id, false);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async returnToParty(@CurrentPlayer() me: Player) {
    await this.assassin.setPresent(me.id, true);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async startVote(@CurrentPlayer() me: Player) {
    await this.assassin.startVote(me.id);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState)
  @UseGuards(PlayerGuard)
  async castVote(
    @CurrentPlayer() me: Player,
    @Args('voteId', { type: () => ID }) voteId: string,
    @Args('candidateId', { type: () => ID }) candidateId: string,
  ) {
    await this.assassin.castVote(me.id, voteId, candidateId);
    return this.assassin.buildState(me.id);
  }

  @Mutation(() => AssassinState, { description: 'The person who called the vote can end it early.' })
  @UseGuards(PlayerGuard)
  async endVote(@CurrentPlayer() me: Player) {
    await this.assassin.endVote(me.id);
    return this.assassin.buildState(me.id);
  }
}

/** Host-only tools, protected by the admin password. */
@Resolver()
@UseGuards(AdminGuard)
export class AssassinAdminResolver {
  constructor(private readonly assassin: AssassinService) {}

  @Query(() => [AdminPlayer], { description: 'Every guest, including secret roles.' })
  adminAssassinPlayers() {
    return this.assassin.adminPlayers();
  }

  @Mutation(() => Boolean)
  async adminSetPlayerStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => LifeStatus }) status: LifeStatus,
  ) {
    await this.assassin.adminSetStatus(id, status);
    return true;
  }

  @Mutation(() => Boolean)
  async adminSetPlayerRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role', { type: () => Role }) role: Role,
  ) {
    await this.assassin.adminSetRole(id, role);
    return true;
  }

  @Mutation(() => Boolean)
  async adminRemovePlayer(@Args('id', { type: () => ID }) id: string) {
    await this.assassin.adminRemovePlayer(id);
    return true;
  }

  @Mutation(() => Boolean)
  async adminEndVote() {
    await this.assassin.adminEndVote();
    return true;
  }

  @Mutation(() => Boolean, { description: 'Wipes every guest, vote and notice to start a new game.' })
  async adminResetAssassin() {
    await this.assassin.adminReset();
    return true;
  }
}
