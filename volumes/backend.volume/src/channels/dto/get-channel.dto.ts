import { ApiProperty } from '@nestjs/swagger';
import { $Enums } from '@prisma/client';
import { GetPublicUserDto } from 'src/users/dto/get-user.dto';

export class ChannelUser {
  userId: number;
  name: string;
  isOnline: boolean;
  @ApiProperty({
    isArray: true,
    enum: $Enums.ChannelSubscriptionRole,
    example: Object.keys($Enums.ChannelSubscriptionRole),
  })
  roles: $Enums.ChannelSubscriptionRole[];
  avatarUrl: string;
  avatar42Url: string;
  isMuted: boolean;
  unMuteAt: Date;
  isFriend: boolean;
  invitationSent: boolean;
}

export class GetPrivateChannelDto {
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
  users: ChannelUser[];
  bannedUsers: GetPublicUserDto[];
}

export class GetPublicChannelDto {
  id: number;
  name: string;
  @ApiProperty({
    isArray: true,
    enum: $Enums.ChannelType,
    example: Object.keys($Enums.ChannelType),
  })
  type: $Enums.ChannelType;
}
