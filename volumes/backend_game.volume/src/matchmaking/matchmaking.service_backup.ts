import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EventEmitter } from 'events';


@Injectable()
export class MatchmakingService {
  public waitingPlayers: Map<string, Socket> = new Map();
  public matchCreated = new EventEmitter();
  

  constructor( 
  ) {}

  public addPlayer(playerId: string, socket: Socket): void {
    this.waitingPlayers.set(playerId, socket);
  }

  public removePlayer(playerId: string): void {
    this.waitingPlayers.delete(playerId);
  }

  private tryStartMatch(): void {
    if (this.waitingPlayers.size >= 2) {
      const idPlayer1 = Array.from(this.waitingPlayers.keys())[0];
      const id1number = parseInt(idPlayer1);
      const idPlayer2 = Array.from(this.waitingPlayers.keys())[1];
      const id2number = parseInt(idPlayer2);
      const player1Socket = this.waitingPlayers.get(idPlayer1);
      const player2Socket = this.waitingPlayers.get(idPlayer2);

      this.waitingPlayers.delete(idPlayer1);
      this.waitingPlayers.delete(idPlayer2);

      const gameId = `${idPlayer1}-${idPlayer2}`;

      // emit un event quand un match est créé
      this.matchCreated.emit('matchCreated', {
        gameId,
        idPlayer1,
        idPlayer2,
        player1Socket,
        player2Socket,
      });
    }
  }

  public startMatchmakingLoop(): void {
    setInterval(() => this.tryStartMatch(), 1000);
  }

}
