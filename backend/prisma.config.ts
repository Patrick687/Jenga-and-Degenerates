import * as dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';
import { prepareDatabaseUrl } from './src/prisma/database-url';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: prepareDatabaseUrl(process.env.DATABASE_URL),
  },
});
