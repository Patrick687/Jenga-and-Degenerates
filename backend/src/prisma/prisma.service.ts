import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { prepareDatabaseUrl } from './database-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({ url: prepareDatabaseUrl(process.env.DATABASE_URL) }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    // WAL keeps reads fast while an admin is saving, and survives a crash cleanly.
    await this.$queryRawUnsafe('PRAGMA journal_mode = WAL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
