import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateCurrentUserDto } from './dto/update-currentUser.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { extname } from 'path';
import * as fs from 'fs';
import { InternalServerErrorException } from '@nestjs/common';
import {
  GetCurrentUserDto,
  GetFriendUserDto,
  GetPublicUserDto,
} from './dto/get-user.dto';
import { Observable, Subject } from 'rxjs';
import { Express } from 'express';


@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}
  //////////////////////////////////////////////////////////////
  private userSubject = new Subject<{ userId: number; what: string }>();

  async emitUserChanged(userId: number, what: string) {
    this.userSubject.next({ userId: userId, what: what });
  }

  getUserChangedObservable(): Observable<{ userId: number; what: string }> {
    return this.userSubject.asObservable();
  }
  //////////////////////////////////////////////////////////////
  async createUserIfNotExist(createUserDto: CreateUserDto) {
    const user = await this.prismaService.user.upsert({
      where: { id: createUserDto.id },
      update: {},
      create: {
        id: createUserDto.id,
        name42: createUserDto.name42,
        avatar42Url: createUserDto.avatar42Url,
      },
    });
    this.emitUserChanged(createUserDto.id, 'user created');
    return user;
  }
  //////////////////////////////////////////////////////////////
  async getEveryoneElse(currentUserId: number): Promise<GetPublicUserDto[]> {
    const myUser = await this.prismaService.user.findUnique({
      where: { id: currentUserId },
      include: this.publictUserPrismaInclude,
    });

    const users = await this.prismaService.user.findMany({
      where: { id: { not: currentUserId } },
      orderBy: { name: 'asc' },
      include: this.publictUserPrismaInclude,
    });
    return users.map((user) => this.formatPublicUserDto(user, myUser));
  }
  //////////////////////////////////////////////////////////////

  async getUserById(userId: number): Promise<string> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    return user.name;
  }

  //////////////////////////////////////////////////////////////

  async getOnGame(userId: number): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { isOnGame: true },
    });
    return user.isOnGame;
  }

  //////////////////////////////////////////////////////////////
  async setIsOnGame(userId: number, is_on_game: boolean) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { isOnGame: true },
    });
    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          isOnGame: is_on_game,
        },
      });
      this.emitUserChanged(userId, 'is_on_game changed');
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }

  //////////////////////////////////////////////////////////////

  async getMyFriends(currentUserId: number): Promise<GetFriendUserDto[]> {
    try {
      const myUser = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        select: { friends: true },
      });
      return myUser.friends.map((user) =>
        this.formatFriendUserDto(myUser, currentUserId),
      );
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async getMe(currentUserId: number): Promise<GetCurrentUserDto> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        include: this.currentUserPrismaInclude,
      });
      return this.formatCurrentUserDto(user);
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async getMyInvitationsSent(
    currentUserId: number,
  ): Promise<GetPublicUserDto[]> {
    try {
      const myUser = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        include: this.publictUserPrismaInclude,
      });
      return myUser.pendingFriendSent.map((pendingFriendSent) =>
        this.formatPublicUserDto(pendingFriendSent, myUser),
      );
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async getMyInvitationsReceived(
    currentUserId: number,
  ): Promise<GetPublicUserDto[]> {
    try {
      const myUser = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        include: this.publictUserPrismaInclude,
      });
      return myUser.pendingFriendRecev.map((pendingFriendRecev) =>
        this.formatPublicUserDto(pendingFriendRecev, myUser),
      );
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e);
    }
  }

  //////////////////////////////////////////////////////////////

  async getMyGames(userId: number) {
    try {
      const winnerMatches = await this.prismaService.matchHistory.findMany({
        where: { winnerId: userId },
      });

      const loserMatches = await this.prismaService.matchHistory.findMany({
        where: { loserId: userId },
      });

      return {
        winnerMatches,
        loserMatches,
      };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  //////////////////////////////////////////////////////////////
  async getMyBlockedUsers(currentUserId: number): Promise<GetPublicUserDto[]> {
    try {
      const myUser = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        include: this.publictUserPrismaInclude,
      });
      return myUser.blockedUsers.map((blockedUser) =>
        this.formatPublicUserDto(blockedUser, myUser),
      );
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e);
    }
  }
  //////////////////////////////////////////////////////////////
  async setMe(
    currentUserId: number,
    updateUserDto: UpdateCurrentUserDto,
  ): Promise<GetCurrentUserDto> {
    if (updateUserDto.name === '')
      throw new ConflictException('Name cannot be empty');
    try {
      const user = await this.prismaService.user.update({
        where: { id: currentUserId },
        include: this.currentUserPrismaInclude,
        data: updateUserDto,
      });
      const userToReturn = this.formatCurrentUserDto(user);
      this.emitUserChanged(currentUserId, 'user changed');
      return userToReturn;
    } catch (e) {
      if (e.code === 'P2002') {
        throw new ConflictException('Username already exists');
      }
    }
  }
  //////////////////////////////////////////////////////////////

  async getMyAvatar(currentUserId: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: currentUserId },
        select: { avatarUrl: true },
      });
      return user.avatarUrl;
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }

  async setMyAvatar(currentUserId: number, file: Express.Multer.File) {
    let newFileName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    newFileName += extname(file.originalname);
    this.getMyAvatar(currentUserId)
      .then((res) => {
        const avatarUrl = res;
        fs.writeFile('./upload/avatar/' + newFileName, file.buffer, (err) => {
          if (err) {
            console.error(err);
          }
          this.prismaService.user
            .update({
              where: { id: currentUserId },
              include: this.currentUserPrismaInclude,
              data: { avatarUrl: newFileName },
            })
            .then((user) => {
              this.emitUserChanged(currentUserId, 'avatar changed');
              fs.unlink('./upload/avatar/' + avatarUrl, (err) => {
                if (err) {
                  console.error(err);
                }
              });
            })
            .catch((err) => {
              console.error(err);
            });
        });
      })
      .catch((err) => {
        console.error(err);
        throw new InternalServerErrorException(
          'avatar upload failed',
          err.message,
        );
      });
    return '/api/static/avatar/' + newFileName;
  }
  //////////////////////////////////////////////////////////////
  async setOnlineStatus(currentUserId: number | undefined, isOnline: boolean) {
    if (currentUserId === undefined) {
      console.error('currentUserId is undefined');
      return;
    }
    try {
      await this.prismaService.user.update({
        where: { id: currentUserId },
        data: {
          isOnline: isOnline,
        },
      });
      if (!isOnline) {
        this.emitUserChanged(currentUserId, 'offline status changed');
      } else {
        this.emitUserChanged(currentUserId, 'online status changed');
      }
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async blockUser(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot block yourself');
    try {
      await this.prismaService.user.update({
        where: { id: currentUserId },
        data: {
          blockedUsers: {
            connect: { id: otherUserId },
          },
        },
      });

      this.emitUserChanged(currentUserId, 'user blocked');
      return { status: 'ok', message: 'User blocked' };
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User to block not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async unBlockUser(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot block yourself');
    try {
      await this.prismaService.user.update({
        where: { id: currentUserId },
        data: {
          blockedUsers: {
            disconnect: { id: otherUserId },
          },
        },
      });

      this.emitUserChanged(currentUserId, 'user unblocked');

      return { status: 'ok', message: 'User unblocked' };
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User to block not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async inviteFriend(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot invite yourself');
    try {
      await this.prismaService.user.update({
        where: { id: currentUserId },
        data: {
          pendingFriendSent: {
            connect: { id: otherUserId },
          },
        },
      });
      this.emitUserChanged(currentUserId, 'invitation sent');
      return { status: 'ok', message: 'Invitation sent' };
    } catch (e) {
      if (e.code === 'P2025') {
        throw new NotFoundException('User to invite not found');
      }
      throw new InternalServerErrorException(e.code);
    }
  }
  //////////////////////////////////////////////////////////////
  async acceptFriend(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot accept yourself');
    const invitations = await this.prismaService.user.findUnique({
      where: { id: currentUserId },
      select: { pendingFriendRecev: true },
    });
    for (const invitation of invitations.pendingFriendRecev) {
      if (invitation.id === otherUserId) {
        try {
          await this.prismaService.user.update({
            where: { id: currentUserId },
            data: {
              friends: {
                connect: { id: otherUserId },
              },
            },
          });
          await this.prismaService.user.update({
            where: { id: otherUserId },
            data: {
              friends: {
                connect: { id: currentUserId },
              },
            },
          });
          await this.prismaService.user.update({
            where: { id: currentUserId },
            data: {
              pendingFriendRecev: {
                disconnect: { id: otherUserId },
              },
            },
          });
          await this.prismaService.user.update({
            where: { id: otherUserId },
            data: {
              pendingFriendRecev: {
                disconnect: { id: currentUserId },
              },
            },
          });
          this.emitUserChanged(currentUserId, 'friend');
        } catch (e) {
          if (e.code === 'P2025') {
            throw new NotFoundException('User to accept not found');
          }
          throw new InternalServerErrorException(e);
        }
        return { status: 'ok', message: 'Invitation accepted' };
      }
    }
    throw new BadRequestException('User to accept has not invited you');
  }
  //////////////////////////////////////////////////////////////
  async rejectInvitationFriend(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot reject yourself');
    const invitations = await this.prismaService.user.findUnique({
      where: { id: currentUserId },
      select: { pendingFriendRecev: true },
    });
    for (const invitation of invitations.pendingFriendRecev) {
      if (invitation.id === otherUserId) {
        try {
          await this.prismaService.user.update({
            where: { id: currentUserId },
            data: {
              pendingFriendRecev: {
                disconnect: { id: otherUserId },
              },
            },
          });
          await this.prismaService.user.update({
            where: { id: otherUserId },
            data: {
              pendingFriendRecev: {
                disconnect: { id: currentUserId },
              },
            },
          });
        } catch (e) {
          if (e.code === 'P2025') {
            throw new NotFoundException('User to reject not found');
          }
          throw new InternalServerErrorException(e);
        }
        this.emitUserChanged(currentUserId, 'invitation rejected');
        return { status: 'ok', message: 'Invitation rejected' };
      }
    }
    throw new BadRequestException('User to reject has not invited you');
  }
  //////////////////////////////////////////////////////////////
  async unFriend(currentUserId: number, otherUserId: number) {
    if (currentUserId === otherUserId)
      throw new ForbiddenException('You cannot unfriend yourself');
    const friends = await this.prismaService.user.findUnique({
      where: { id: currentUserId },
      select: { friends: true },
    });
    for (const friend of friends.friends) {
      if (friend.id === otherUserId) {
        try {
          await this.prismaService.user.update({
            where: { id: currentUserId },
            data: {
              friends: {
                disconnect: { id: otherUserId },
              },
            },
          });
          await this.prismaService.user.update({
            where: { id: otherUserId },
            data: {
              friends: {
                disconnect: { id: currentUserId },
              },
            },
          });
          this.emitUserChanged(currentUserId, 'unfriend');
        } catch (e) {
          if (e.code === 'P2025') {
            throw new NotFoundException('User to unfriend not found');
          }
          throw new InternalServerErrorException(e);
        }
        return { status: 'ok', message: 'User unfriended successfuly' };
      }
    }
    throw new BadRequestException('User to unfriend is not your friend');
  }
  //////////////////////////////////////////////////////////////
  private publictUserPrismaInclude = {
    friends: true,
    blockedUsers: true,
    pendingFriendRecev: true,
    pendingFriendSent: true,
  };

  private formatPublicUserDto(user, currentUser): GetPublicUserDto {
    return {
      id: user.id,
      name: user.name,
      name42: user.name42,
      avatarUrl: this.formatAvatarUrl(user.avatarUrl),
      avatar42Url: user.avatar42Url,
      isOnline: user.isOnline,
      isOnGame: user.isOnGame,
      isFriend: currentUser.friends.some((friend) => friend.id === user.id),
      invitationSent: currentUser.pendingFriendSent.some(
        (pendingFriendRecv) => pendingFriendRecv.id === user.id,
      ),
    };
  }
  //////////////////////////////////////////////////////////////
  private formatFriendUserDto(user, currentUserId: number): GetFriendUserDto {
    return {
      id: user.id,
      name: user.name,
      name42: user.name42,
      avatarUrl: this.formatAvatarUrl(user.avatarUrl),
      avatar42Url: user.avatar42Url,
      isOnline: user.isOnline,
      isOnGame: user.isOnGame,
    };
  }
  //////////////////////////////////////////////////////////////
  private currentUserPrismaInclude = {};
  private formatCurrentUserDto(user): GetCurrentUserDto {
    return {
      ...user,
      avatarUrl: this.formatAvatarUrl(user.avatarUrl),
    };
  }
  private formatAvatarUrl(avatarFile: string): string {
    return 'api/static/avatar/' + avatarFile;
  }
  //////////////////////////////////////////////////////////////
}
