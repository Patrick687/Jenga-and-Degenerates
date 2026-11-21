import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Args, GqlExecutionContext, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateCardInput } from './card.inputs';
import { Card } from './card.model';
import { SubmitCardInput } from './submission.inputs';
import { CardSubmission } from './submission.model';
import { SubmissionRateLimiter } from './submission-rate-limiter';
import { SubmissionsService } from './submissions.service';

@Injectable()
export class SubmissionRateLimitGuard implements CanActivate {
  constructor(private readonly limiter: SubmissionRateLimiter) {}

  canActivate(context: ExecutionContext): boolean {
    const { req } = GqlExecutionContext.create(context).getContext<{ req: Request }>();
    this.limiter.consume(req.ip ?? 'unknown');
    return true;
  }
}

/** Public: guests suggest cards. */
@Resolver()
export class SubmitCardResolver {
  constructor(private readonly submissions: SubmissionsService) {}

  @Mutation(() => Boolean, {
    description: 'Suggest a card. It joins the deck once the host approves it. Public.',
  })
  @UseGuards(SubmissionRateLimitGuard)
  async submitCard(@Args('input') input: SubmitCardInput): Promise<boolean> {
    await this.submissions.submit(input);
    return true;
  }
}

/** Host-only: review the suggestion box. */
@Resolver(() => CardSubmission)
@UseGuards(AdminGuard)
export class SubmissionsAdminResolver {
  constructor(private readonly submissions: SubmissionsService) {}

  @Query(() => [CardSubmission], { description: 'Suggestions waiting for a decision, oldest first.' })
  adminCardSubmissions() {
    return this.submissions.listPending();
  }

  @Mutation(() => Card, { description: 'Adds the suggestion to the deck, optionally with edits.' })
  approveSubmission(
    @Args('id', { type: () => ID }) id: string,
    @Args('edits', { type: () => UpdateCardInput, nullable: true }) edits?: UpdateCardInput,
  ) {
    return this.submissions.approve(id, edits);
  }

  @Mutation(() => Boolean)
  async rejectSubmission(@Args('id', { type: () => ID }) id: string) {
    await this.submissions.reject(id);
    return true;
  }

  @Mutation(() => Int, { description: 'Approves every waiting suggestion. Returns how many cards were added.' })
  approveAllSubmissions() {
    return this.submissions.approveAll();
  }
}
