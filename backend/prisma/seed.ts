import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { prepareDatabaseUrl } from '../src/prisma/database-url';
import { PrismaClient } from '../src/generated/prisma/client';
import { Category } from '../src/generated/prisma/enums';

dotenv.config();

interface SeedCard {
  id: string;
  category: Category;
  text: string;
  spicy: boolean;
}

/**
 * Loads the starter cards (the same ones the game ships with).
 *
 *   npm run db:seed            fills an EMPTY database; does nothing if cards exist,
 *                              so your edits and deletions are never overwritten.
 *   npm run db:seed -- --force wipes all cards and reloads the starter set.
 */
async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: prepareDatabaseUrl(process.env.DATABASE_URL) }),
  });

  try {
    const existing = await prisma.card.count();
    if (existing > 0 && !force) {
      console.log(`Database already has ${existing} cards. Skipping seed (use --force to reset).`);
      return;
    }

    const cards = JSON.parse(
      readFileSync(join(__dirname, 'seed-cards.json'), 'utf8'),
    ) as SeedCard[];

    await prisma.$transaction([
      prisma.card.deleteMany(),
      // Staggered timestamps keep the starter cards in their original order.
      ...cards.map((card, index) =>
        prisma.card.create({
          data: { ...card, createdAt: new Date(Date.UTC(2026, 0, 1) + index * 1000) },
        }),
      ),
    ]);
    console.log(`Seeded ${cards.length} cards.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
