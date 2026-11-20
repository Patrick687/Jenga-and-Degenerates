import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface Attempts {
  failures: number;
  windowEndsAt: number;
}

/**
 * Slows down password guessing: after too many wrong passwords from one IP,
 * further attempts are rejected until the window passes. In memory only, which
 * is fine for a single-process app.
 */
@Injectable()
export class LoginAttemptLimiter {
  static readonly MAX_FAILURES = 10;
  static readonly WINDOW_MS = 15 * 60 * 1000;

  private readonly attempts = new Map<string, Attempts>();

  assertAllowed(ip: string, now = Date.now()): void {
    this.prune(now);
    const entry = this.attempts.get(ip);
    if (entry && entry.failures >= LoginAttemptLimiter.MAX_FAILURES) {
      throw new HttpException(
        'Too many wrong passwords. Try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(ip: string, now = Date.now()): void {
    const entry = this.attempts.get(ip);
    if (entry && entry.windowEndsAt > now) {
      entry.failures += 1;
    } else {
      this.attempts.set(ip, { failures: 1, windowEndsAt: now + LoginAttemptLimiter.WINDOW_MS });
    }
  }

  reset(ip: string): void {
    this.attempts.delete(ip);
  }

  private prune(now: number): void {
    for (const [ip, entry] of this.attempts) {
      if (entry.windowEndsAt <= now) this.attempts.delete(ip);
    }
  }
}
