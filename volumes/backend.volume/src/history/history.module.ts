import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [HistoryController],
  providers: [HistoryService],
  imports: [HttpModule, PrismaModule],
  exports: [HistoryService],
})
export class HistoryModule {}
