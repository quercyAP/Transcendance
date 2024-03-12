import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StaticModule } from './static/static.module';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { Server } from 'socket.io';
import { HistoryModule } from './history/history.module';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'IO',
      useFactory: () => {
        const io = new Server();
        return io;
      },
    },
  ],
  imports: [AuthModule, StaticModule, UsersModule, ChannelsModule, HistoryModule],
})
export class AppModule {}
