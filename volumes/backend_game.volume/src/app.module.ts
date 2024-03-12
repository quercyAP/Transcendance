import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { Server } from 'socket.io';

@Module({
  imports: [HttpModule,],
  controllers: [AppController],
  providers: [
    AppService,
    GameGateway,
    GameService,
    MatchmakingService,
    {
      provide: 'IO',
      useFactory: () => {
        const io = new Server();
        return io;
      },
    },
  ],
})
export class AppModule {}
