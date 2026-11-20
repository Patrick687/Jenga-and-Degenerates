import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

export const DEFAULT_DATABASE_URL = 'file:./data/jenga.db';

/**
 * Turns a `file:` SQLite URL into one with an absolute path (relative paths are
 * resolved from the backend folder, where every npm script and the server run),
 * and makes sure the folder exists. Used by both the app and the Prisma CLI so
 * they always point at the same file.
 */
export function prepareDatabaseUrl(raw: string | undefined): string {
  const url = raw?.trim() || DEFAULT_DATABASE_URL;
  if (!url.startsWith('file:')) {
    throw new Error(`DATABASE_URL must be a SQLite "file:" URL, got "${url}"`);
  }
  const filePath = url.slice('file:'.length);
  if (filePath === ':memory:' || filePath === '') return url;
  const absolute = isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  mkdirSync(dirname(absolute), { recursive: true });
  return `file:${absolute}`;
}
