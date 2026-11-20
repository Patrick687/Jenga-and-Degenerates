import { HttpException } from '@nestjs/common';
import { LoginAttemptLimiter } from './login-attempt-limiter';

describe('LoginAttemptLimiter', () => {
  const now = 1_000_000;

  it('allows attempts until the failure limit is reached', () => {
    const limiter = new LoginAttemptLimiter();
    for (let i = 0; i < LoginAttemptLimiter.MAX_FAILURES - 1; i += 1) limiter.recordFailure('a', now);
    expect(() => limiter.assertAllowed('a', now)).not.toThrow();
    limiter.recordFailure('a', now);
    expect(() => limiter.assertAllowed('a', now)).toThrow(HttpException);
  });

  it('tracks each IP separately', () => {
    const limiter = new LoginAttemptLimiter();
    for (let i = 0; i < LoginAttemptLimiter.MAX_FAILURES; i += 1) limiter.recordFailure('a', now);
    expect(() => limiter.assertAllowed('b', now)).not.toThrow();
  });

  it('forgets failures after the window passes', () => {
    const limiter = new LoginAttemptLimiter();
    for (let i = 0; i < LoginAttemptLimiter.MAX_FAILURES; i += 1) limiter.recordFailure('a', now);
    expect(() =>
      limiter.assertAllowed('a', now + LoginAttemptLimiter.WINDOW_MS + 1),
    ).not.toThrow();
  });

  it('clears the count after a successful login', () => {
    const limiter = new LoginAttemptLimiter();
    for (let i = 0; i < LoginAttemptLimiter.MAX_FAILURES; i += 1) limiter.recordFailure('a', now);
    limiter.reset('a');
    expect(() => limiter.assertAllowed('a', now)).not.toThrow();
  });
});
