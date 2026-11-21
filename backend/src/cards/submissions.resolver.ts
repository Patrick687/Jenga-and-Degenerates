import { CanActivate, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { Args, GqlExecutionContext, Mutation, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { SubmitCardInput } from './submission.inputs';
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

/** Public: guests add cards to the deck. */
@Resolver()
export class SubmitCardResolver {
  constructor(private readonly submissions: SubmissionsService) {}

  @Mutation(() => Boolean, { description: 'Add a card to the deck. Public, rate limited.' })
  @UseGuards(SubmissionRateLimitGuard)
  async submitCard(@Args('input') input: SubmitCardInput): Promise<boolean> {
    await this.submissions.submit(input);
    return true;
  }
}
