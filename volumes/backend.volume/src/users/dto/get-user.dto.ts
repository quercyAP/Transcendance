import { $Enums } from '@prisma/client';
import { ChannelUser } from 'src/channels/dto/get-channel.dto';

export class GetCurrentUserDto {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  avatarUrl: string;
  avatar42Url: string;
  is2FAEnabled: boolean;
  isOnline: boolean;
  isOnGame?: boolean;
}

export class GetPublicUserDto {
  id: number;
  name: string;
  name42: string;
  avatarUrl: string;
  avatar42Url: string;
  isFriend: boolean;
  invitationSent: boolean;
  isOnline: boolean;
  isOnGame?: boolean;
}

export class GetFriendUserDto {
  id: number;
  name: string;
  name42: string;
  avatarUrl: string;
  avatar42Url: string;
  isOnline: boolean;
  isOnGame?: boolean;
}

export class Whisper {
  channelId: number;
  name: string | undefined;
  messageId?: number;
  content: string;
}
