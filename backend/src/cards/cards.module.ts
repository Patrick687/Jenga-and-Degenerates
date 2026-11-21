import { Module } from '@nestjs/common';
import { CardsResolver } from './cards.resolver';
import { CardsService } from './cards.service';
import { SubmissionRateLimiter } from './submission-rate-limiter';
import {
  SubmissionRateLimitGuard,
  SubmissionsAdminResolver,
  SubmitCardResolver,
} from './submissions.resolver';
import { SubmissionsService } from './submissions.service';

@Module({
  providers: [
    CardsResolver,
    CardsService,
    SubmissionsService,
    SubmissionRateLimiter,
    SubmissionRateLimitGuard,
    SubmitCardResolver,
    SubmissionsAdminResolver,
  ],
})
export class CardsModule {}
