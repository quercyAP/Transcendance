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
import { MatchmakingService } from 'src/matchmaking/matchmaking.service_backup';

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
  private matchmakingService: Map<string, MatchmakingService> | null =
    new Map();
  private gameResolvers: { [gameId: string]: (value?: any) => void };
  private gamePromises: { [gameId: string]: Promise<any> };

  constructor(private readonly gameService: GameService) {
    this.gamePromises = {};
    this.gameResolvers = {};
  }

  afterInit() {
    console.log('GameGateway initialized');
  }

  async startGame(gameId: string, playerId1: string, playerId2: string) {
    const settings = await this.getNextSettings(gameId);
    console.log('Starting the game between', playerId1, 'and', playerId2);
    this.startGameLoop(gameId);
  }

  @SubscribeMessage('letsgo')
  handleBonus(client: Socket, gameId: string) {
    console.log('letsgo:', gameId);
    const resolver = this.gameResolvers[gameId];
    if (resolver) {
      resolver();
      delete this.gameResolvers[gameId];
      delete this.gamePromises[gameId];
    }
  }

  getNextSettings(gameId: string): Promise<any> {
    if (!this.gamePromises[gameId]) {
      this.gamePromises[gameId] = new Promise<any>((resolve) => {
        this.gameResolvers[gameId] = resolve;
      });
    }
    return this.gamePromises[gameId];
  }

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
  }

  @SubscribeMessage('preDisconnect')
  handlePreDisconnect(client: Socket, payload: any) {
    console.log('Client pre-disconnected: ', payload);
    clearInterval(this.intervalIds.get(payload));
    this.intervalIds.delete(payload);
    if (this.gameService.getGameState(payload)) {
      this.gameService.deleteGame(payload);
    }
  }

  describeKeyBonus(key: string) {
    if (key.includes('noBonus')) {
      return false;
    } else {
      return true;
    }
  }

  describeKeySpeed(key: string) {
    if (key.includes('4')) {
      return 4;
    } else if (key.includes('7')) {
      return 7;
    } else {
      return 10;
    }
  }

  matchMakingLoop(key: string) {
    this.matchmakingService.get(key).startMatchmakingLoop();
    this.matchmakingService
      .get(key)
      .matchCreated.on(
        'matchCreated',
        ({ gameId, idPlayer1, idPlayer2, player1Socket, player2Socket }) => {
          player1Socket.join(gameId);
          player2Socket.join(gameId);
          this.ioServer
            .to(gameId)
            .emit('matchStarted', { gameId, idPlayer1, idPlayer2 });
          this.gameService.createGame(
            gameId,
            idPlayer1,
            idPlayer2,
            this.describeKeyBonus(key),
            this.describeKeySpeed(key),
          );
          this.matchmakingService.delete(key);
          this.startGame(gameId, idPlayer1, idPlayer2);
        },
      );
  }

  removePlayerFromMatchmaking(playerId: string) {
    for (const [key, value] of this.matchmakingService.entries()) {
      if (value.waitingPlayers.has(playerId)) {
        console.log('Player removed from matchmaking: ', playerId);
        value.waitingPlayers.delete(playerId);
        if (value.waitingPlayers.size === 0) {
          this.matchmakingService.delete(key);
        }
      }
    }
  }

  @SubscribeMessage('submit')
  handleStart(client: Socket, payload: any) {
    this.removePlayerFromMatchmaking(payload.user);
    console.log('Player added to matchmaking: ', payload.user);
    if (!this.matchmakingService.has(payload.key)) {
      this.matchmakingService.set(payload.key, new MatchmakingService());
      this.matchmakingService.get(payload.key).addPlayer(payload.user, client);
    } else {
      this.matchmakingService.get(payload.key).addPlayer(payload.user, client);
      this.matchMakingLoop(payload.key);
    }
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
