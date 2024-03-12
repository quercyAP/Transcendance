import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { Public } from 'src/auth/auth.decorator';
const mime = require('mime');

@Controller('api/static')
export class StaticController {
  constructor() {}

  @Public()
  @Get('avatar/*')
  getAvatar(@Req() req, @Res({ passthrough: true }) res): StreamableFile {
    const path = join('upload/avatar/', req.params[0]);
    if (fs.existsSync(path)) {
      const file = fs.createReadStream(path);
      res.set({
        'Content-Type': mime.getType(path),
      });
      return new StreamableFile(file);
    }

    throw new NotFoundException();
  }
}
