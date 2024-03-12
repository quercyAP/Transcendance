import { Inject, Logger, forwardRef } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { AsyncApiSub } from 'nestjs-asyncapi';
import { v4 as uuidv4 } from 'uuid';
import { ChannelsService } from 'src/channels/channels.service';
import { Whisper } from './dto/get-user.dto';

@WebSocketGateway({
  namespace: 'users',
  path: '/api/socket.io/',
  origins: '*:*',
  credentials: true,
})
export class UsersGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly authService: AuthService,
    private usersService: UsersService,
    @Inject(forwardRef(() => ChannelsService))
    private readonly channelsService: ChannelsService,
  ) {}
  private readonly logger = new Logger(UsersGateway.name);

  private connectedClients = new Map<string, User>();
  private connectedSockets = new Map<number, Socket>();

  @WebSocketServer()
  private ioServer: Server;
  //////////////////////////////////////////////////////////////
  afterInit() {
    this.logger.log('Initialized');

    this.usersService.getUserChangedObservable().subscribe({
      next: async (subject) => {
        await this.emitUserChanged(subject.userId, subject.what);
      },
    });

    this.channelsService.getChannelChangedObservable().subscribe({
      next: async (subject) => {
        if (subject.channelId === 0) {
          this.ioServer.emit('users/channel_changed', subject.what);
        } else {
          this.ioServer
            .to(`channel_${subject.channelId}`)
            .emit('users/channel_changed', subject.what);
        }
      },
    });
  }
  //////////////////////////////////////////////////////////////
  async handleConnection(socket: Socket): Promise<void> {
    const token = this.extractTokenFromHeader(socket);
    if (!token) {
      socket.disconnect();
    }
    try {
      const user = await this.authService.asyncVerifyToken(token);
      this.connectedClients.set(socket.id, user);
      this.connectedSockets.set(
        this.connectedClients.get(socket.id).id,
        socket,
      );
      socket.join('user:' + this.connectedClients.get(socket.id).id);
      const channels = await this.channelsService.findUserChannels(
        this.connectedClients.get(socket.id).id,
      );

      if (channels.length > 0) {
        channels.forEach((subscription) => {
          socket.join(`channel_${subscription.id}`);
        });
      }
      this.logger.log(
        `Client: ${this.connectedClients.get(socket.id).name} connected`,
      );
      await this.usersService.setOnlineStatus(
        this.connectedClients.get(socket.id).id,
        true,
      );
    } catch (err) {
      socket.emit('error', err.message);
      this.logger.log(`Client id: ${socket.id} rejected: ${err.message}`);
    }
  }

  //////////////////////////////////////////////////////////////
  async handleDisconnect(socket: Socket) {
    this.logger.log(
      `Client: ${this.connectedClients.get(socket.id)?.name} disconnected`,
    );
    const user = this.connectedClients.get(socket.id);

    await this.usersService.setOnlineStatus(
      this.connectedClients.get(socket.id)?.id,
      false,
    );
    // this.connectedSockets.delete(this.connectedClients.get(socket.id).id);
    this.connectedClients.delete(socket.id);

    this.connectedClients.forEach(async (value, key) => {
      if (user.name === value.name) {
        await this.usersService.setOnlineStatus(user.id, true);
      }
    });
  }
  //////////////////////////////////////////////////////////////
  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { channelId: number; content: string },
  ) {
    client.join(`channel_${payload.channelId}`);
    const message = {
      channelId: payload.channelId,
      content: payload.content,
      name: this.connectedClients.get(client.id).name,
      messageId: uuidv4(),
      senderId: this.connectedClients.get(client.id).id,
    };
    this.ioServer
      .to(`channel_${payload.channelId}`)
      .emit('newMessage', message);
  }
  //////////////////////////////////////////////////////////////
  @SubscribeMessage('sendWhisper')
  async handleWhisper(
    client: Socket,
    payload: { whisper: Whisper; userFrom: any; userTo: any },
  ) {
    const userToSocket = this.connectedSockets.get(payload.userTo.userId);
    if (!userToSocket) {
      return;
    }
    client.join(`whisper_${payload.userTo.userId}_${payload.userFrom.userId}`);
    userToSocket.join(
      `whisper_${payload.userFrom.userId}_${payload.userTo.userId}`,
    );

    const senderId = this.connectedClients.get(client.id).id;
    const receiverId = payload.userTo.userId;

    const message = {
      channelId: payload.whisper.channelId,
      content: payload.whisper.content,
      name: this.connectedClients.get(client.id).name,
      messageId: uuidv4(),
      senderId: this.connectedClients.get(client.id).id,
    };

    const resPayload = {
      whisper: message,
      userFrom: payload.userFrom,
      userTo: payload.userTo,
    };

    this.ioServer
      .to(`whisper_${receiverId}_${senderId}`)
      .emit('newWhisper', resPayload);
    this.ioServer
      .to(`whisper_${senderId}_${receiverId}`)
      .emit('newWhisper', resPayload);
  }

  //////////////////////////////////////////////////////////////
  @AsyncApiSub({
    channel: 'users/user_changed',
    message: {
      payload: String,
    },
  })
  async emitUserChanged(myUserId: number, what: string) {
    if (what === 'offline status changed') {
      const room = `update_except_${myUserId}`;
      this.connectedClients.forEach((user) => {
        const socket = this.connectedSockets.get(user.id);
        socket?.join(room);
      });

      this.ioServer.to(room).emit('users/user_changed', what);

      this.connectedClients.forEach((user) => {
        const socket = this.connectedSockets.get(user.id);
        socket?.leave(room);
      });
    } else {
      this.ioServer.emit('users/user_changed', what);
    }
  }
  //////////////////////////////////////////////////////////////
  public extractTokenFromHeader(socket: Socket): string | undefined {
    const headers: any = socket.handshake.headers;
    if (!headers.cookie) {
      return undefined;
    }
    const cookies = headers.cookie.split(';');
    if (!cookies) {
      return undefined;
    }
    const cookie = cookies.find((cookie) => cookie.includes('trans42_access'));
    if (!cookie) {
      return undefined;
    }
    const token = cookie.split('=')[1];
    return token;
  }
  //////////////////////////////////////////////////////////////
  public joinChannelRoom(userId: number, channelId: number) {
    const userSocket = this.connectedSockets.get(userId);
    userSocket.join(`channel_${channelId}`);
  }

  public leaveChannelRoom(userId: number, channelId: number) {
    const userSocket = this.connectedSockets.get(userId);
    userSocket.leave(`channel_${channelId}`);
  }
}
