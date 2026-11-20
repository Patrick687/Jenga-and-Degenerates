import { Global, Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AuthResolver } from './auth.resolver';
import { LoginAttemptLimiter } from './login-attempt-limiter';

@Global()
@Module({
  providers: [AdminGuard, LoginAttemptLimiter, AuthResolver],
  exports: [AdminGuard, LoginAttemptLimiter],
})
export class AuthModule {}
