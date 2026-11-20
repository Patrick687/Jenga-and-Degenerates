import { Module } from '@nestjs/common';
import { AssassinAdminResolver, AssassinResolver } from './assassin.resolver';
import { AssassinService } from './assassin.service';
import { GameClock, GameRandom } from './game-runtime';
import { PlayerGuard } from './player.guard';

@Module({
  providers: [AssassinService, AssassinResolver, AssassinAdminResolver, PlayerGuard, GameClock, GameRandom],
})
export class AssassinModule {}
