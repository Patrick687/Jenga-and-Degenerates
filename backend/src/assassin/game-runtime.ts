import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

/** Wall clock, injectable so tests can move time forward. */
@Injectable()
export class GameClock {
  now(): Date {
    return new Date();
  }
}

/** Randomness, injectable so tests can make role assignment deterministic. */
@Injectable()
export class GameRandom {
  /** A whole number from 0 up to (not including) `maxExclusive`. */
  int(maxExclusive: number): number {
    return randomInt(maxExclusive);
  }
}
