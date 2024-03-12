import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';

export class CreatedChannelDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  @ApiProperty({
    isArray: true,
    enum: $Enums.ChannelType,
    example: Object.keys($Enums.ChannelType),
  })
  type: $Enums.ChannelType;
}
