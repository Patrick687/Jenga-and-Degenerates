export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  ADMIN_PASSWORD: string;
  CORS_ORIGIN: string[];
  /** Assassin game: minutes an assassin must wait between kills. */
  ASSASSIN_COOLDOWN_MINUTES: number;
  /** Assassin game: how long a vote stays open. */
  VOTE_SECONDS: number;
}

export const MIN_ADMIN_PASSWORD_LENGTH = 8;

function positiveInt(env: Record<string, unknown>, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a whole number of 1 or more, got "${String(raw)}".`);
  }
  return value;
}

/** Validates environment variables once at startup so misconfiguration fails fast. */
export function validateEnv(env: Record<string, unknown>): AppConfig {
  const password = typeof env.ADMIN_PASSWORD === 'string' ? env.ADMIN_PASSWORD : '';
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be set to at least ${MIN_ADMIN_PASSWORD_LENGTH} characters (see .env.example).`,
    );
  }

  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a whole number between 1 and 65535, got "${String(env.PORT)}".`);
  }

  const corsOrigin =
    typeof env.CORS_ORIGIN === 'string'
      ? env.CORS_ORIGIN.split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : [];

  return {
    NODE_ENV: typeof env.NODE_ENV === 'string' ? env.NODE_ENV : 'development',
    PORT: port,
    HOST: typeof env.HOST === 'string' && env.HOST ? env.HOST : '127.0.0.1',
    ADMIN_PASSWORD: password,
    CORS_ORIGIN: corsOrigin,
    ASSASSIN_COOLDOWN_MINUTES: positiveInt(env, 'ASSASSIN_COOLDOWN_MINUTES', 12),
    VOTE_SECONDS: positiveInt(env, 'VOTE_SECONDS', 120),
  };
}
