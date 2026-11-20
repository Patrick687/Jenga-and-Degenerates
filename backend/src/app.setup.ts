import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Application } from 'express';
import type { AppConfig } from './config/env.validation';

/** Shared by main.ts and the e2e tests so both run with identical behaviour. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  // Behind nginx on the same machine, trust its X-Forwarded-For header so the
  // login rate limit sees real client IPs. Headers from anywhere else are ignored.
  const express = app.getHttpAdapter().getInstance() as Application;
  express.set('trust proxy', 'loopback');

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const corsOrigin = config.get('CORS_ORIGIN', { infer: true });
  if (corsOrigin.length > 0) {
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  app.enableShutdownHooks();
}
