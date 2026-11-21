import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Keeps one noisy device from flooding the suggestion box. Generous on purpose:
 * everyone at a party shares one Wi-Fi network, so they all look like one address.
 * In memory only, which is fine for a single-process app.
 */
@Injectable()
export class SubmissionRateLimiter {
  static readonly MAX_PER_WINDOW = 60;
  static readonly WINDOW_MS = 10 * 60 * 1000;

  private readonly hits = new Map<string, number[]>();

  /** Counts this request, or throws if the address has sent too many recently. */
  consume(ip: string, now = Date.now()): void {
    const recent = (this.hits.get(ip) ?? []).filter((time) => time > now - SubmissionRateLimiter.WINDOW_MS);
    if (recent.length >= SubmissionRateLimiter.MAX_PER_WINDOW) {
      this.hits.set(ip, recent);
      throw new HttpException(
        'That is a lot of suggestions! Give it a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.hits.set(ip, recent);
    if (this.hits.size > 1000) this.prune(now);
  }

  private prune(now: number): void {
    for (const [ip, times] of this.hits) {
      if (times.every((time) => time <= now - SubmissionRateLimiter.WINDOW_MS)) this.hits.delete(ip);
    }
  }
}
