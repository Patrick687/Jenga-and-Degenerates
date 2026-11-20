import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Used by the deploy to confirm the API and its database are up. */
  @Get()
  async check(): Promise<{ status: 'ok'; cards: number }> {
    return { status: 'ok', cards: await this.prisma.card.count() };
  }
}
