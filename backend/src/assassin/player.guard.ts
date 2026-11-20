import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { Player } from '../generated/prisma/client';

type PlayerRequest = Request & { player?: Player };

/** Recognises a guest by the secret `X-Player-Token` header sent from their own phone. */
@Injectable()
export class PlayerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext<{ req: PlayerRequest }>();
    const header = req.headers['x-player-token'];
    const token = Array.isArray(header) ? header[0] : header;
    if (!token) throw new UnauthorizedException('Join the party first.');

    const player = await this.prisma.player.findUnique({ where: { token } });
    if (!player) throw new UnauthorizedException('We lost track of you. Join the party again.');

    req.player = player;
    return true;
  }
}

/** The guest making the request (only valid behind PlayerGuard). */
export const CurrentPlayer = createParamDecorator((_data: unknown, context: ExecutionContext): Player => {
  const { req } = GqlExecutionContext.create(context).getContext<{ req: PlayerRequest }>();
  if (!req.player) throw new UnauthorizedException('Join the party first.');
  return req.player;
});
