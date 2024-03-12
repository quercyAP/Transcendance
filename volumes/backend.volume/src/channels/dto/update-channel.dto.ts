import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateChannelDto } from './create-channel.dto';
import { $Enums } from '@prisma/client';

export class UpdateChannelDto extends PartialType(CreateChannelDto) {}

export class UpdateChannelTypeDto {
  @ApiProperty({
    isArray: true,
    enum: $Enums.ChannelType,
    example: Object.keys($Enums.ChannelType),
  })
  type: $Enums.ChannelType;
  newPassword?: string;
  oldPassword?: string;
}

export class InviteUserToPrivateDto {
  userId: number;
  channelId: number;
}

export class SetAdminDto extends InviteUserToPrivateDto {}

export class KickUserDto extends InviteUserToPrivateDto {}

export class MuteUserDto extends InviteUserToPrivateDto {}

export class BanUserDto extends InviteUserToPrivateDto {}
