import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';

export class CreateChannelDto {
  @ApiProperty({
    example: 'My Channel',
    description: 'The name of the channel (must be unique)',
  })
  name?: string;
  @ApiProperty({
    isArray: true,
    enum: $Enums.ChannelType,
    example: Object.keys($Enums.ChannelType),
  })
  type: $Enums.ChannelType;
  password?: string;
}
