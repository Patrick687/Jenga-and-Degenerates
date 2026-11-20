import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AppConfig } from '../config/env.validation';
import { LoginAttemptLimiter } from './login-attempt-limiter';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** Compares in constant time so response timing doesn't leak the password. */
export function passwordsMatch(supplied: string, expected: string): boolean {
  return timingSafeEqual(digest(supplied), digest(expected));
}

function readBearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer (.+)$/);
  return match?.[1] ?? null;
}

/** Protects a resolver with the shared admin password, sent as `Authorization: Bearer <password>`. */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly expectedPassword: string;

  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly limiter: LoginAttemptLimiter,
  ) {
    this.expectedPassword = config.get('ADMIN_PASSWORD', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    const { req } = GqlExecutionContext.create(context).getContext<{ req: Request }>();
    const ip = req.ip ?? 'unknown';
    this.limiter.assertAllowed(ip);

    const supplied = readBearerToken(req.headers.authorization);
    if (supplied !== null && passwordsMatch(supplied, this.expectedPassword)) {
      this.limiter.reset(ip);
      return true;
    }

    // Only a wrong password counts as a guess. A missing one is just a logged-out visitor.
    if (supplied !== null) this.limiter.recordFailure(ip);
    throw new UnauthorizedException('Wrong or missing admin password.');
  }
}
