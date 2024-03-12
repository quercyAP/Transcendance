import { Controller, Post, Res, Req, Body, HttpCode, HttpException } from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { Public } from '../auth/auth.decorator';


@Controller('history')
export class HistoryController {

    constructor(private readonly historyService: HistoryService) {}
    
    @Public()
    @Post()
    createHistory(@Body() createHistoryDTO: CreateHistoryDto, @Res() res) {
        return this.historyService.createHistory(createHistoryDTO, res);
    }
}