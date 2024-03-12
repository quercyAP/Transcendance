import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersGateway } from './users.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelsModule } from 'src/channels/channels.module';

@Module({
  controllers: [UsersController],
  providers: [UsersGateway, UsersService],
  imports: [
    forwardRef(() => ChannelsModule),
    PrismaModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UsersGateway, UsersService],
})
export class UsersModule {}
