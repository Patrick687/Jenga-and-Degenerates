import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Database from 'better-sqlite3';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';

export const ADMIN_PASSWORD = 'correct horse battery';

/** A clock the tests can move forward. */
export class FakeClock {
  private current = new Date('2026-11-21T20:00:00.000Z');
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
  advanceMinutes(minutes: number): void {
    this.advance(minutes * 60_000);
  }
}

/** Random numbers the tests control: queue values, otherwise it returns 0. */
export class FakeRandom {
  private queued: number[] = [];
  queue(...values: number[]): void {
    this.queued.push(...values);
  }
  int(): number {
    return this.queued.shift() ?? 0;
  }
}

export interface TestApp {
  app: INestApplication;
  gql: (
    query: string,
    variables?: Record<string, unknown>,
    password?: string,
    headers?: Record<string, string>,
  ) => Promise<GqlResponse>;
  clock: FakeClock;
  random: FakeRandom;
  close: () => Promise<void>;
}

export interface GqlResponse {
  status: number;
  data: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/** Applies the real migration files to a fresh temporary SQLite database. */
function createMigratedDatabase(): { url: string; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'jenga-test-'));
  const file = join(dir, 'test.db');
  const db = new Database(file);
  const migrationsDir = join(__dirname, '..', 'prisma', 'migrations');
  for (const name of readdirSync(migrationsDir).sort()) {
    if (name.endsWith('.toml')) continue;
    db.exec(readFileSync(join(migrationsDir, name, 'migration.sql'), 'utf8'));
  }
  db.close();
  return { url: `file:${file}`, dir };
}

export async function createTestApp(options: { realRandom?: boolean } = {}): Promise<TestApp> {
  const database = createMigratedDatabase();
  process.env.DATABASE_URL = database.url;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;

  // Imported late so the env vars above are in place first.
  const { AppModule } = await import('../src/app.module');
  const { configureApp } = await import('../src/app.setup');

  const { GameClock, GameRandom } = await import('../src/assassin/game-runtime');
  const clock = new FakeClock();
  const random = new FakeRandom();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(GameClock)
    .useValue(clock)
    .overrideProvider(GameRandom)
    .useValue(options.realRandom ? new GameRandom() : random)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return {
    app,
    clock,
    random,
    gql: async (query, variables, password, headers) => {
      const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
      if (password !== undefined) req.set('Authorization', `Bearer ${password}`);
      for (const [name, value] of Object.entries(headers ?? {})) req.set(name, value);
      const res = await req;
      return { status: res.status, data: res.body.data ?? null, errors: res.body.errors };
    },
    close: async () => {
      await app.close();
      rmSync(database.dir, { recursive: true, force: true });
    },
  };
}
