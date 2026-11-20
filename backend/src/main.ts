import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import type { AppConfig } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const port = config.get('PORT', { infer: true });
  const host = config.get('HOST', { infer: true });
  await app.listen(port, host);
  new Logger('Bootstrap').log(`GraphQL API listening on http://${host}:${port}/graphql`);
}

void bootstrap();
