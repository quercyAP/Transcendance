
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Res }  from '@nestjs/common';
import { Body } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class HistoryService {
    constructor(private prisma: PrismaService) {}

    async createHistory(@Body() createHistoryDto: CreateHistoryDto, @Res() res: any) {
        try {
            await this.prisma.matchHistory.create({
                data : { ...createHistoryDto }});
            return res.status(201).json(createHistoryDto);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }




}