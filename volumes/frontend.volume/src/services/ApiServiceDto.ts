export interface CurrentUser {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  avatarUrl: string;
  avatar42Url: string;
  is2FAEnabled: boolean;
  isOnline: boolean;
  isOnGame: boolean;
  showCard: boolean;
  
}

export interface PublicUser {
  id: number;
  name: string;
  name42: string;
  avatarUrl: string;
  avatar42Url: string;
  isFriend: boolean;
  invitationSent: boolean;
  isOnline: boolean;
  isOnGame: boolean;
  showCard: boolean;
  pendingFriendRecev?: boolean;
  isBlocked?: boolean;
}
export interface Channel {
  isMuted: boolean;
  unMuteAt: Date;
  roles: ChannelSubscriptionRole[];
  channel: ChannelType;
  id: number;
  name: string;
}

export interface GetPrivateChannel {
  id: number;
  name: string;
  type: ChannelType;
  users: ChannelUsers[];
  bannedUsers?: PublicUser[];
}

export interface ChannelUsers {
  userId: number;
  name: string;
  roles: ChannelSubscriptionRole;
  avatarUrl: string;
  isOnline: boolean;
  avatar42Url: string;
  isMuted: boolean;
  unMuteAt: Date;
}

export interface GetPublicChannel {
  id: number;
  name: string;
  type: ChannelType;
}
export interface createChannel {
  name: string;
  type: ChannelType;
  password: string;
}

export interface Message {
  channelId: number;
  messageId?: number;
  content: string;
  name: string | undefined;
}

export interface Match {
  id: number;
  createdAt: string;
  updatedAt: string;
  winnerScore: number;
  loserScore: number;
  winnerId: number;
  loserId: number;
}

export interface MatchHistory {
  winnerMatches: Match[];
  loserMatches: Match[];
}

export interface inviteInfo {
  host: string;
  guest: string;
  gameId: string;
}

export enum ChannelSubscriptionRole {
  ADMIN,
  OWNER,
}

export enum ChannelType {
    PUBLIC,
    PRIVATE,
    PROTECTED,
    WHISPER
}
