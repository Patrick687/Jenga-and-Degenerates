import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { AssassinModule } from './assassin/assassin.module';
import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code-first: the schema is generated from the TypeScript classes, in memory.
      autoSchemaFile: true,
      sortSchema: true,
      // Keep the schema private in production.
      introspection: !isProduction,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    PrismaModule,
    AuthModule,
    CardsModule,
    AssassinModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
