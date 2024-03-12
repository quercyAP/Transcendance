import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from './game.service';
import { MatchmakingService } from 'src/matchmaking/matchmaking.service';

@WebSocketGateway({
  path: '/game/api/socket.io/',
  origins: '*:*',
  credentials: true,
})
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private ioServer: Server;
  private intervalIds: Map<string, NodeJS.Timeout> | null = new Map();
  private matchmakingService = new MatchmakingService(); 
  private letsgoCount: Map<string, number> = new Map();

  constructor(private readonly gameService: GameService) {
  }

  afterInit() {
    console.log('GameGateway initialized');
    this.matchmakingService.matchCreated.on('matchCreated',
        ({ gameId, idPlayer1, idPlayer2, player1Socket, player2Socket, speed, bonus, }) => {
          console.log('matchCreated socket: ', player1Socket.id, player2Socket.id);
          player1Socket.join(gameId);
          player2Socket.join(gameId);
          console.log('matchCreated', gameId, idPlayer1, idPlayer2);
          this.ioServer
            .to(gameId)
            .emit('matchStarted', { gameId, idPlayer1, idPlayer2 });
          this.gameService.createGame(
            gameId,
            idPlayer1,
            idPlayer2,
            bonus,
            speed,
          );
        },
      );
  }

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
    const id: string = client.handshake.query.id as string;
    console.log('id', id);
    if (this.matchmakingService.isPlayerLoggedIn(id)) {
      console.log('Player already logged in');
      const previousSocket = this.matchmakingService.getLoggedInPlayer(id);
      // previousSocket.join(id);
      // this.ioServer.to(id).emit('disconnectDuplicate', id);
      this.matchmakingService.removePlayerFromLoggedIn(previousSocket);
      this.matchmakingService.removePlayerFromInvitationGames(previousSocket);
      this.matchmakingService.removePlayerFromMatchmakingBySocket(previousSocket);
      previousSocket.disconnect();
    }
    this.matchmakingService.addLoggedInPlayer(id, client);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
    const id: string = this.matchmakingService.getNameBySocket(client);
    console.log('id', id);
    const gameId: string = this.matchmakingService.isPlayerInCurrentGames(id);
    console.log('gameId', gameId);
    console.log(this.matchmakingService.currentGames.size);
    if(gameId){
      clearInterval(this.intervalIds.get(gameId));
      this.intervalIds.delete(gameId);
      if (this.gameService.getGameState(gameId)) {
        this.gameService.deleteGame(gameId);
        const oppenentId: string = this.matchmakingService.getOpponentId(id);
        console.log('oppenentId', oppenentId);
        const socket: Socket = this.matchmakingService.getLoggedInPlayer(oppenentId);
        console.log('socket', socket.id);
        socket.join(oppenentId);
        this.ioServer.to(oppenentId).emit('hasQuit', {oppenentId: id});
        if (this.matchmakingService.currentGames.has(gameId)) {
          this.matchmakingService.currentGames.delete(gameId);
        }
      }
    }
    this.matchmakingService.removePlayerFromMatchmakingBySocket(client);
    this.matchmakingService.removePlayerFromLoggedIn(client);
    this.matchmakingService.removePlayerFromInvitationGames(client);
  }

  @SubscribeMessage('submit')
  handleSubmit(client: Socket, payload: any) {
  console.log('submit received for:', payload.user);
  const PlayerInfos = {
    socket: client,
    gamesettings: payload.key,
  };
  this.matchmakingService.addPlayer(payload.user, PlayerInfos);  
  }

  startGameLoop(gameId: string) {
    if (!this.intervalIds.has(gameId)) {
      this.gameService.matchEnded.removeAllListeners('matchEnded');
      this.gameService.matchEnded.on(
        'matchEnded',
        ({ gameId, winner, scoreWinner, loser, scoreLoser }) => {
          this.ioServer.to(gameId).emit('matchEnded', {
            gameId,
            winner,
            scoreWinner,
            loser,
            scoreLoser,
          });
          clearInterval(this.intervalIds.get(gameId));
          this.intervalIds.delete(gameId);
          if (this.gameService.getGameState(gameId)) {
            this.gameService.deleteGame(gameId);
          } 
          if (this.matchmakingService.currentGames.has(gameId)) {
            this.matchmakingService.currentGames.delete(gameId);
          }
        },
      );
    }
    const intervalId = setInterval(() => {
      this.gameService.updateGameState(gameId);
      this.ioServer
        .to(gameId)
        .emit('gameState', this.gameService.getGameState(gameId));
    }, 1000 / 60);
    this.intervalIds.set(gameId, intervalId);
  }

  @SubscribeMessage('letsgo')
  handleBonus(client: Socket, gameId: string) {
    console.log('lose of gameId of currentgames', this.matchmakingService.currentGames.has(gameId));
    console.log('letsgo received for:', gameId, 'from', this.matchmakingService.getNameBySocket(client) );
    if (!this.matchmakingService.currentGames.has(gameId)) {
      
      console.log('game not found');
      return;
    }
    const currentCount = this.letsgoCount.get(gameId) || 0;
    console.log('currentCount', currentCount);
    this.letsgoCount.set(gameId, currentCount + 1);
    if (currentCount + 1 >= 2) {
      this.letsgoCount.delete(gameId);
      this.startGameLoop(gameId);
    }
  }

  @SubscribeMessage('invite')
  handleInvite(client: Socket, payload: any) {
    const guest: string = payload.guest;
    const host: string = payload.host;
    const gameId: string = payload.gameId;
    const socketHost: Socket = this.matchmakingService.getLoggedInPlayer(host);
    socketHost.join(host);
    const socketGuest: Socket = this.matchmakingService.getLoggedInPlayer(guest);
    socketGuest.join(guest);
    if (! this.matchmakingService.isPlayerFree(guest) || ! this.matchmakingService.isPlayerFree(host)) {
        this.ioServer.to(host).emit('invite', {
          host: host,
          guest: guest,
          gameId : `${host}-${guest}`,
          inviteStatus: false,
          reason: 'player already invited/inviting',
        });      
      return;
    } else{
          this.matchmakingService.setisPlayerFree(host, false);
          this.matchmakingService.waitingForInvite(payload.gameId, parseInt(host), client, payload.bonus);
          this.matchmakingService.setisPlayerFree(guest, false);
          this.ioServer.to(guest).emit('invite', {
            host: host,
            guest: guest,
            gameId : `${host}-${guest}`,
            bonus: payload.bonus,
          });
    }
  }



  @SubscribeMessage('inviteResponse')
  handleResponseInvite(client: Socket, payload: any) {
    const gameId = payload.gameID;
    const response = payload.response;
    const guest = payload.guest;
    const host = payload.host;
    const socket: Socket = client;
    const settings = payload.bonus;
    if (response === true && this.matchmakingService.invitationGames.has(gameId)) {
      this.matchmakingService.waitingForInvite(gameId, guest, socket, settings);
      }
    else if (response === true && !this.matchmakingService.invitationGames.has(gameId)) {
      socket.join(guest.toString());
      this.matchmakingService.setisPlayerFree(guest.toString(), false);
      this.ioServer.to(guest.toString()).emit('invite', {
        host: host,
        guest: guest.toString(),
        gameId : `${host}-${guest}`,
        inviteStatus: false,
        reason: 'Sorry, host player has quit',
      });
    }
    else if (response === false) {
      this.matchmakingService.invitationGames.delete(gameId);
      this.matchmakingService.setisPlayerFree(guest, true);
      this.matchmakingService.setisPlayerFree(host, true);
      this.ioServer.to(host).emit('invite', {
        host: host,
        guest: guest,
        gameId : `${host}-${guest}`,
        inviteStatus: false,
        reason: payload.reason,
      });
    }
  }

  @SubscribeMessage('preDisconnect')
  handlePreDisconnect(client: Socket, payload: any) {
    clearInterval(this.intervalIds.get(payload.gameId));
    console.log('preDisconnect received for:', payload);
    this.matchmakingService.removePlayerFromMatchmaking(payload.userId);
    this.matchmakingService.removePlayerFromMatchmaking(payload.oppenentId);
    this.intervalIds.delete(payload.gameId);
    if (this.gameService.getGameState(payload.gameId)) {
      this.matchmakingService.currentGames.delete(payload.gameId);
      this.gameService.deleteGame(payload.gameId);
      const oppenentId: string = payload.oppenentId as string;
      const userId: string = payload.userId as string;
      const socket: Socket = this.matchmakingService.getLoggedInPlayer(oppenentId);
      socket.join(oppenentId);
      this.ioServer.to(oppenentId).emit('hasQuit', {oppenentId: userId});
    }
  }

  @SubscribeMessage('input')
  handleInput(client: Socket, payload: any) {
    this.gameService.handlePlayerAction(
      payload.userId,
      payload.key,
      payload.gameId,
    );
  }

  @SubscribeMessage('mousemove')
  handleMouse(client: Socket, payload: any) {
    this.gameService.handleMouse(
      payload.winHeight,
      payload.move,
      payload.userId,
      payload.gameId,
    );
  }



}
