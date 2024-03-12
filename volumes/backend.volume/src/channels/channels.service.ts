import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import {
  BanUserDto,
  InviteUserToPrivateDto,
  KickUserDto,
  SetAdminDto,
  UpdateChannelTypeDto,
} from './dto/update-channel.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatedChannelDto } from './dto/created-channel.dto';
import {
  GetPrivateChannelDto,
  GetPublicChannelDto,
} from './dto/get-channel.dto';
import { Observable, Subject } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { ChannelSubscription, User } from '@prisma/client';
import { UsersGateway } from 'src/users/users.gateway';
@Injectable()
export class ChannelsService {
  constructor(
    @Inject(forwardRef(() => UsersGateway))
    private readonly usersGateway: UsersGateway,
    private readonly prisma: PrismaService,
  ) {}

  /////////////////////////////////////////////////////////////////////////////////
  private channelSubject = new Subject<{ channelId: number; what: string }>();
  private muteTimeouts = new Map<string, NodeJS.Timeout>();

  async emitChannelChanged(channelId: number, what: string) {
    this.channelSubject.next({ channelId, what });
  }

  getChannelChangedObservable(): Observable<{
    channelId: number;
    what: string;
  }> {
    return this.channelSubject.asObservable();
  }
  /////////////////////////////////////////////////////////////////////////////////
  async create(
    ownerId: number,
    createChannelDto: CreateChannelDto,
  ): Promise<CreatedChannelDto> {
    const { password } = createChannelDto;
    if (password && password.length < 4) {
      throw new BadRequestException('Password must be at least 4 characters');
    }
    if (!password && createChannelDto.type === 'PROTECTED') {
      throw new BadRequestException('Password is required');
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
      this.emitChannelChanged(0, 'created');
      const createdChannel = await this.prisma.channel.create({
        data: {
          ...createChannelDto,
          password: encryptedPassword,
          users: {
            create: [
              {
                roles: ['OWNER'],
                user: {
                  connect: {
                    id: ownerId,
                  },
                },
              },
            ],
          },
        },
      });
      this.usersGateway.joinChannelRoom(ownerId, createdChannel.id);
      return createdChannel;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Channel name already exists');
      }
      throw new BadRequestException(e);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async findAllPublic(): Promise<GetPublicChannelDto[]> {
    const channels = await this.prisma.channel.findMany({
      where: { OR: [{ type: 'PROTECTED' }, { type: 'PUBLIC' }] },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!channels) {
      throw new NotFoundException('Channels not found');
    }
    const channelsPublic = channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
    }));
    return channelsPublic;
  }
  /////////////////////////////////////////////////////////////////////////////////
  async findUserChannels(
    userId: number,
  ): Promise<GetPrivateChannelDto[] | GetPublicChannelDto[]> {
    // Récupère les abonnements aux canaux de l'utilisateur
    const subscriptions = await this.prisma.channelSubscription.findMany({
      where: {
        userId: userId,
      },
      include: {
        channel: true, // Inclut les détails du canal
      },
    });
    if (!subscriptions.length) {
      return [];
    }

    // Extrayez les canaux des abonnements
    const channels = subscriptions.map((subscription) => subscription.channel);

    return channels;
  }
  /////////////////////////////////////////////////////////////////////////////////
  async joinPublic(
    currentUseriD: number,
    channelId: number,
    password?: string,
  ) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      include: {
        bannedUsers: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const userInChannel = channel.users.map((user) => {
      return { ...user.user };
    });
    this.checkUserIsInChannel(userInChannel, currentUseriD);
    this.checkUserIsBanned(channel.bannedUsers, currentUseriD);
    if (channel.type === 'PUBLIC') {
      const ret = await this.prisma.channelSubscription.create({
        data: {
          channel: {
            connect: {
              id: channelId,
            },
          },
          user: {
            connect: {
              id: currentUseriD,
            },
          },
        },
      });
      this.emitChannelChanged(0, 'joined');
      this.usersGateway.joinChannelRoom(currentUseriD, channelId);
      return ret;
    } else if (channel.type === 'PROTECTED') {
      const isPasswordValid = await bcrypt.compare(password, channel.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password');
      }
      const ret = await this.prisma.channelSubscription.create({
        data: {
          channel: {
            connect: {
              id: channelId,
            },
          },
          user: {
            connect: {
              id: currentUseriD,
            },
          },
        },
      });
      this.emitChannelChanged(0, 'joined');
      this.usersGateway.joinChannelRoom(currentUseriD, channelId);
      return ret;
    } else {
      throw new BadRequestException('Invalid channel type is PRIVATE');
    }
  }
  /////////////////////////////////////////////////////////////////////////////////
  async kickUser(
    currentUserId: number,
    kickUserDto: KickUserDto,
  ): Promise<ChannelSubscription> {
    const currentUserRoles = await this.getCurrentUserRoles(
      kickUserDto.channelId,
      currentUserId,
    );
    if (
      currentUserRoles.includes('OWNER') ||
      currentUserRoles.includes('ADMIN')
    ) {
      const userToKickRoles = await this.getCurrentUserRoles(
        kickUserDto.channelId,
        kickUserDto.userId,
      );
      if (userToKickRoles.includes('OWNER'))
        throw new ForbiddenException(
          'You cannot kick the owner of the channel',
        );
      try {
        const ret = await this.prisma.channelSubscription.delete({
          where: {
            userId_channelId: {
              userId: kickUserDto.userId,
              channelId: kickUserDto.channelId,
            },
          },
        });
        this.usersGateway.leaveChannelRoom(
          kickUserDto.userId,
          kickUserDto.channelId,
        );
        this.emitChannelChanged(0, 'kicked');
        return ret;
      } catch (e) {
        if (e.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
        throw new BadRequestException(e.code);
      }
    } else {
      throw new ForbiddenException(
        'You are not the owner/admin of this channel',
      );
    }
  }
  /////////////////////////////////////////////////////////////////////////////////
  async muteUser(
    currentUserId: number,
    muteUserDto: KickUserDto,
  ): Promise<ChannelSubscription> {
    const currentUserRoles = await this.getCurrentUserRoles(
      muteUserDto.channelId,
      currentUserId,
    );
    if (
      currentUserRoles.includes('OWNER') ||
      currentUserRoles.includes('ADMIN')
    ) {
      try {
        const subscription = await this.prisma.channelSubscription.findUnique({
          where: {
            userId_channelId: {
              userId: muteUserDto.userId,
              channelId: muteUserDto.channelId,
            },
          },
        });

        if (!subscription) {
          throw new NotFoundException('User not found');
        }

        if (subscription.roles.includes('OWNER')) {
          throw new ForbiddenException(
            'You cannot mute the owner of the channel',
          );
        }

        const unMuteAt = new Date(
          Math.max(Date.now(), subscription.unMuteAt?.getTime() || 0) + 10000,
        );
        const ret = await this.prisma.channelSubscription.update({
          where: {
            userId_channelId: {
              userId: muteUserDto.userId,
              channelId: muteUserDto.channelId,
            },
          },
          data: {
            isMuted: true,
            unMuteAt: unMuteAt,
          },
        });

        this.emitChannelChanged(muteUserDto.channelId, 'muted');

        const timeoutKey = `${muteUserDto.channelId}_${muteUserDto.userId}`;

        if (this.muteTimeouts.has(timeoutKey)) {
          clearTimeout(this.muteTimeouts.get(timeoutKey));
        }
        const delay = unMuteAt.getTime() - Date.now();
        const timeoutId = setTimeout(async () => {
          await this.prisma.channelSubscription.update({
            where: {
              userId_channelId: {
                userId: muteUserDto.userId,
                channelId: muteUserDto.channelId,
              },
            },
            data: {
              isMuted: false,
              unMuteAt: null,
            },
          });
          this.emitChannelChanged(muteUserDto.channelId, 'unmuted');
        }, delay);

        this.muteTimeouts.set(timeoutKey, timeoutId);
        return ret;
      } catch (e) {
        if (e.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
        throw new BadRequestException(e.message);
      }
    } else {
      throw new ForbiddenException(
        'You are not the owner/admin of this channel',
      );
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async leave(currentUserId: number, channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const currentUserSubscription = channel.users.find(
      (subscription) => subscription.userId === currentUserId,
    );
    if (!currentUserSubscription) {
      throw new ConflictException('You are not in this channel');
    }
    const isOwner = currentUserSubscription.roles.some(
      (role) => role === 'OWNER',
    );
    if (isOwner) {
      const potentialNewOwners = channel.users.filter(
        (subscription) =>
          subscription.userId !== currentUserId &&
          subscription.roles.includes('ADMIN'),
      );
      if (potentialNewOwners.length > 0) {
        await this.prisma.channelSubscription.update({
          where: {
            userId_channelId: {
              userId: potentialNewOwners[0].userId,
              channelId: channelId,
            },
          },
          data: {
            roles: {
              set: ['OWNER'],
            },
          },
        });
      } else if (channel.users.length === 1) {
        await this.prisma.channel.delete({
          where: {
            id: channelId,
          },
        });
        this.usersGateway.leaveChannelRoom(currentUserId, channelId);
        this.emitChannelChanged(0, 'deleted');
        return {
          message:
            'You are the only member of this channel, channel deleted successfully',
        };
      } else {
        throw new ConflictException(
          'You are the owner of this channel, you cannot leave it without promoting another user to owner',
        );
      }
    }

    // Suppression de l'abonnement de l'utilisateur au canal
    await this.prisma.channelSubscription.delete({
      where: {
        userId_channelId: {
          userId: currentUserId,
          channelId: channelId,
        },
      },
    });
    this.usersGateway.leaveChannelRoom(currentUserId, channelId);
    this.emitChannelChanged(0, 'deleted');

    return { message: 'Leave channel successfully' };
  }
  /////////////////////////////////////////////////////////////////////////////////
  async findAllCurrentUser(
    currentUserId: number,
  ): Promise<GetPrivateChannelDto[]> {
    const channels = await this.prisma.channel.findMany({
      where: {
        users: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        bannedUsers: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!channels) {
      throw new NotFoundException('Channels not found');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
      select: {
        friends: true,
        pendingFriendSent: true,
      },
    });

    const channelsWithUsers = channels.map((channel) => ({
      ...channel,
      bannedUsers: channel.bannedUsers.map((user) => {
        return {
          id: user.id,
          name: user.name,
          name42: user.name42,
          avatarUrl: user.avatarUrl,
          avatar42Url: user.avatar42Url,
          isOnline: user.isOnline,
          isFriend: currentUser.friends.some((friend) => friend.id === user.id),
          invitationSent: currentUser.pendingFriendSent.some(
            (friend) => friend.id === user.id,
          ),
        };
      }),
      users: channel.users.map((user) => {
        return {
          userId: user.userId,
          name: user.user.name,
          isMuted: user.isMuted,
          unMuteAt: user.unMuteAt,
          isOnline: user.user.isOnline,
          roles: user.roles,
          avatarUrl: user.user.avatarUrl,
          avatar42Url: user.user.avatar42Url,
          isFriend: currentUser.friends.some(
            (friend) => friend.id === user.userId,
          ),
          invitationSent: currentUser.pendingFriendSent.some(
            (friend) => friend.id === user.userId,
          ),
        };
      }),
    }));
    return channelsWithUsers;
  }

  /////////////////////////////////////////////////////////////////////////////////
  async findOneCurrentUser(
    currentUserId: number,
    id: number,
  ): Promise<GetPrivateChannelDto> {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: id,
      },
      include: {
        bannedUsers: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
    if (!channel) {
      throw new BadRequestException('Channel not found');
    }
    const currentUserSubscription = channel.users.find(
      (subscription) => subscription.userId === currentUserId,
    );
    if (!currentUserSubscription) {
      throw new NotFoundException('User not in this channel');
    }
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
      select: {
        friends: true,
        pendingFriendSent: true,
      },
    });

    const channelWithUsers = {
      ...channel,
      bannedUsers: channel.bannedUsers.map((user) => {
        return {
          id: user.id,
          name: user.name,
          name42: user.name42,
          avatarUrl: user.avatarUrl,
          avatar42Url: user.avatar42Url,
          isOnline: user.isOnline,
          isFriend: currentUser.friends.some((friend) => friend.id === user.id),
          invitationSent: currentUser.pendingFriendSent.some(
            (friend) => friend.id === user.id,
          ),
        };
      }),
      users: channel.users.map((user) => {
        return {
          userId: user.userId,
          name: user.user.name,
          isMuted: user.isMuted,
          unMuteAt: user.unMuteAt,
          isOnline: user.user.isOnline,
          roles: user.roles,
          avatarUrl: user.user.avatarUrl,
          avatar42Url: user.user.avatar42Url,
          isFriend: currentUser.friends.some(
            (friend) => friend.id === user.userId,
          ),
          invitationSent: currentUser.pendingFriendSent.some(
            (friend) => friend.id === user.userId,
          ),
        };
      }),
    };
    return channelWithUsers;
  }

  /////////////////////////////////////////////////////////////////////////////////
  async updateNameByOwner(
    currentUserId: number,
    id: number,
    name: string,
  ): Promise<string> {
    const currentUserRoles = await this.getCurrentUserRoles(id, currentUserId);
    if (!currentUserRoles.includes('OWNER'))
      throw new ForbiddenException('You are not the owner of this channel');

    try {
      await this.prisma.channel.update({
        where: { id: id },
        data: name,
      });
      return name;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Channel name already exists');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Channel not found');
      }
      throw new BadRequestException(e.code);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async updateTypePswdByOwner(
    currentUserId: number,
    id: number,
    updateChannelTypeDto: UpdateChannelTypeDto,
  ): Promise<CreatedChannelDto> {
    const currentUserRoles = await this.getCurrentUserRoles(id, currentUserId);
    if (!currentUserRoles.includes('OWNER'))
      throw new ForbiddenException('You are not the owner of this channel');
    if (
      updateChannelTypeDto.type !== 'PROTECTED' &&
      updateChannelTypeDto.type !== 'PUBLIC' &&
      updateChannelTypeDto.type !== 'PRIVATE'
    ) {
      throw new BadRequestException('Invalid channel type');
    }
    if (
      updateChannelTypeDto.type === 'PUBLIC' ||
      updateChannelTypeDto.type === 'PRIVATE'
    ) {
      const ret = this.prisma.channel.update({
        where: { id: id },
        data: {
          type: updateChannelTypeDto.type,
          password: null,
        },
      });
      this.emitChannelChanged(0, 'updated');
      return ret;
    } else if (updateChannelTypeDto.type === 'PROTECTED') {
      const { newPassword, oldPassword } = updateChannelTypeDto;
      const channelType = await this.getChannelType(id);
      if (!newPassword || (!oldPassword && channelType === 'PROTECTED')) {
        throw new BadRequestException(
          'New password and old password are required',
        );
      }
      if (newPassword.length < 4) {
        throw new BadRequestException(
          'New password must be at least 4 characters',
        );
      }
      const channel = await this.prisma.channel.findUnique({
        where: {
          id: id,
        },
        select: {
          password: true,
        },
      });
      if (!channel) {
        throw new NotFoundException('Channel not found');
      }
      if (channelType === 'PROTECTED') {
        const isPasswordValid = await bcrypt.compare(
          oldPassword,
          channel.password,
        );
        if (!isPasswordValid) {
          throw new BadRequestException('Invalid old password');
        }
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const { password, ...ret } = await this.prisma.channel.update({
          where: { id: id },
          data: {
            type: 'PROTECTED',
            password: encryptedPassword,
          },
        });
        this.emitChannelChanged(0, 'updated');
        return ret;
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const { password, ...ret } = await this.prisma.channel.update({
          where: { id: id },
          data: {
            type: 'PROTECTED',
            password: encryptedPassword,
          },
        });
        this.emitChannelChanged(0, 'updated');
        return ret;
      }
    }
  }
  /////////////////////////////////////////////////////////////////////////////////
  async setAdminByOwner(
    currentUserId: number,
    setAdminDto: SetAdminDto,
  ): Promise<ChannelSubscription> {
    const currentUserRoles = await this.getCurrentUserRoles(
      setAdminDto.channelId,
      currentUserId,
    );
    if (!currentUserRoles.includes('OWNER'))
      throw new ForbiddenException('You are not the owner of this channel');
    try {
      return await this.prisma.channelSubscription.update({
        where: {
          userId_channelId: {
            userId: setAdminDto.userId,
            channelId: setAdminDto.channelId,
          },
        },
        data: {
          roles: {
            set: ['ADMIN'],
          },
        },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new BadRequestException(e.code);
    }
  }
  /////////////////////////////////////////////////////////////////////////////////
  async removeByOwner(
    currentUserId: number,
    id: number,
  ): Promise<CreatedChannelDto> {
    const currentUserRoles = await this.getCurrentUserRoles(id, currentUserId);
    if (!currentUserRoles.includes('OWNER'))
      throw new ForbiddenException('You are not the owner of this channel');
    try {
      this.emitChannelChanged(0, 'deleted');
      return await this.prisma.channel.delete({
        where: { id: id },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('Channel not found');
      }
      throw new BadRequestException(e.code);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async inviteUserToPrivate(
    currentUserId: number,
    inviteUserToPrivateDto: InviteUserToPrivateDto,
  ): Promise<CreatedChannelDto> {
    const currentUserRoles = await this.getCurrentUserRoles(
      +inviteUserToPrivateDto.channelId,
      currentUserId,
    );
    if (
      !(
        currentUserRoles.includes('OWNER') || currentUserRoles.includes('ADMIN')
      )
    )
      throw new ForbiddenException(
        'You are not the owner/admin of this channel',
      );
    if (+inviteUserToPrivateDto.userId === currentUserId)
      throw new BadRequestException('You cannot invite yourself');
    try {
      const ret = await this.prisma.channel.update({
        where: { id: +inviteUserToPrivateDto.channelId },
        data: {
          users: {
            create: [
              {
                user: {
                  connect: {
                    id: +inviteUserToPrivateDto.userId,
                  },
                },
              },
            ],
          },
        },
      });
      this.usersGateway.joinChannelRoom(+inviteUserToPrivateDto.userId, ret.id);
      this.emitChannelChanged(0, 'invited');
      return ret;
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (e.code === 'P2002') {
        throw new ConflictException('User already in channel');
      }
      throw new BadRequestException(e.code);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async banUser(
    currentUserId: number,
    banUserDto: BanUserDto,
  ): Promise<CreatedChannelDto> {
    const currentUserRoles = await this.getCurrentUserRoles(
      banUserDto.channelId,
      currentUserId,
    );
    if (
      !(
        currentUserRoles.includes('OWNER') || currentUserRoles.includes('ADMIN')
      )
    )
      throw new ForbiddenException(
        'You are not the owner/admin of this channel',
      );
    if (banUserDto.userId === currentUserId)
      throw new BadRequestException('You cannot ban yourself');
    const userTobanRoles = await this.getCurrentUserRoles(
      banUserDto.channelId,
      banUserDto.userId,
    );
    if (userTobanRoles.includes('OWNER'))
      throw new ForbiddenException('You cannot ban the owner of the channel');
    try {
      await this.prisma.channelSubscription.delete({
        where: {
          userId_channelId: {
            userId: banUserDto.userId,
            channelId: banUserDto.channelId,
          },
        },
      });
      this.usersGateway.leaveChannelRoom(
        banUserDto.userId,
        banUserDto.channelId,
      );
      this.emitChannelChanged(0, 'banned');
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not in channel');
      }
      throw new BadRequestException(e.code);
    }
    try {
      return await this.prisma.channel.update({
        where: { id: banUserDto.channelId },
        data: {
          bannedUsers: {
            connect: {
              id: banUserDto.userId,
            },
          },
        },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (e.code === 'P2002') {
        throw new ConflictException('User already banned');
      }
      throw new BadRequestException(e.code);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  async unBanUser(
    currentUserId: number,
    inviteUserToPrivateDto: InviteUserToPrivateDto,
  ): Promise<CreatedChannelDto> {
    const currentUserRoles = await this.getCurrentUserRoles(
      inviteUserToPrivateDto.channelId,
      currentUserId,
    );
    if (
      !(
        currentUserRoles.includes('OWNER') || currentUserRoles.includes('ADMIN')
      )
    )
      throw new ForbiddenException(
        'You are not the owner/admin of this channel',
      );
    if (inviteUserToPrivateDto.userId === currentUserId)
      throw new BadRequestException('You cannot unban yourself');

    try {
      return await this.prisma.channel.update({
        where: { id: inviteUserToPrivateDto.channelId },
        data: {
          bannedUsers: {
            disconnect: {
              id: inviteUserToPrivateDto.userId,
            },
          },
        },
      });
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not banned');
      }
      if (e.code === 'P2002') {
        throw new ConflictException('User already banned');
      }
      throw new BadRequestException(e.code);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  private async getCurrentUserRoles(channelId: number, currentUserId: number) {
    const channel = await this.findOneCurrentUser(currentUserId, channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    const currentUser = channel.users.find(
      (user) => user.userId === currentUserId,
    );
    return currentUser.roles;
  }

  /////////////////////////////////////////////////////////////////////////////////
  private checkUserIsBanned(channelBannedList: User[], currentUserId: number) {
    const currentUser = channelBannedList.find(
      (user) => user.id === currentUserId,
    );
    if (currentUser) {
      throw new ForbiddenException('You are banned from this channel');
    }
  }

  private checkUserIsInChannel(
    channelUsersList: User[],
    currentUserId: number,
  ) {
    const currentUser = channelUsersList.find(
      (user) => user.id === currentUserId,
    );
    if (currentUser) {
      throw new ConflictException('You are already in this channel');
    }
  }

  private async getChannelType(channelId: number) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        id: channelId,
      },
      select: {
        type: true,
      },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel.type;
  }
}
