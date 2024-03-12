import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EventEmitter } from 'events';

interface PlayerInfos{
  socket: Socket;
  isPlayerFree?: boolean;
  gamesettings?: string;
}

interface hostPlayerInfos {
  socket: Socket;
  settings: string;
  name: number;
}

interface gameInfos {
  idPlayer1: string;
  idPlayer2: string;
  player1Socket: Socket;
  player2Socket: Socket;
}


@Injectable()
export class MatchmakingService {
  public waitingPlayers: Map<number, PlayerInfos> = new Map();
  public matchCreated = new EventEmitter();
  public loggedInplayers: Map<string, PlayerInfos> = new Map();
  public invitationGames: Map<string, hostPlayerInfos> = new Map();
  public currentGames: Map<string, gameInfos> = new Map();

  constructor( 
  ) {}

  public addPlayer(playerId: number, playerInfos: PlayerInfos): void {
    if (this.findPlayerWithSameId(playerId)) {
      this.waitingPlayers.delete(playerId);
      this.waitingPlayers.set(playerId, playerInfos);
      return;
    } 
    if (this.waitingPlayers.size <1) {
      this.waitingPlayers.set(playerId, playerInfos);
      return;
    }
    if (this.findPlayerWithSameGameSettings(playerInfos)) {
      const id = this.findPlayerWithSameGameSettings(playerInfos);
      this.startMatchMatchmaking(id, playerId, playerInfos);
    } else {
      this.waitingPlayers.set(playerId, playerInfos);
    }
  }  

  public removePlayerFromMatchmaking(playerId: number): void {
    this.waitingPlayers.delete(playerId);
  }

  public removePlayerFromMatchmakingBySocket(socket: Socket): void {
    this.waitingPlayers.forEach((infos, id) => {
      if (infos.socket.id === socket.id) {
        this.waitingPlayers.delete(id);
      }
    });
  }

  public addLoggedInPlayer(playerId: string, socket: Socket): void {
    const playerInfos: PlayerInfos = {
      socket: socket,
      isPlayerFree: true,
    };
    this.loggedInplayers.set(playerId, playerInfos);
  }

  public removeLoggedInPlayer(playerId: string): void {
    this.loggedInplayers.delete(playerId);
  }
  
  public getLoggedInPlayer(playerId: string): Socket | undefined{
    const player: string = playerId.toString();
     const playerSocket = this.loggedInplayers.get(player).socket;
    return playerSocket;
  }

  public isPlayerLoggedIn(playerId: string): boolean {
    return this.loggedInplayers.has(playerId);
  }
  
  public getNameBySocket(socket: Socket): string | undefined {
    for (const [id, infos] of this.loggedInplayers) {
      if (infos.socket.id === socket.id) {
        return id;
      }
    }
  }

  public removePlayerFromLoggedIn(socket: Socket): void {
    this.loggedInplayers.forEach((infos, id) => {
      if (infos.socket.id === socket.id) {
        this.loggedInplayers.delete(id);
      }
    });
  }

  public removePlayerFromInvitationGames(socket: Socket): void {
    this.invitationGames.forEach((infos, id) => {
      if (infos.socket.id === socket.id) {
        this.invitationGames.delete(id);
      }
    });
  }

  public isPlayerInCurrentGames(playerId: string): string | null {
    for (const [gameId, infos] of this.currentGames) {
      if (infos.idPlayer1 === playerId || infos.idPlayer2 === playerId) {
        return gameId;
      }
    }
    return null;
  }

  public getOpponentId(playerId: string): string | null {
    for (const [gameId, infos] of this.currentGames) {
      if (infos.idPlayer1 === playerId) {
        return infos.idPlayer2;
      } else if (infos.idPlayer2 === playerId) {
        return infos.idPlayer1;
      }
    }
    return null;
  }

  public getOpponentSocket(playerId: string): Socket | undefined {
    for (const [gameId, infos] of this.currentGames) {
      if (infos.idPlayer1 === playerId) {
        return infos.player2Socket;
      } else if (infos.idPlayer2 === playerId) {
        return infos.player1Socket;
      }
    }
  }

  private findPlayerWithSameId(id: number): boolean {
    return this.waitingPlayers.has(id);
  }

  private findPlayerWithSameGameSettings(playerInfos: PlayerInfos): number | null {
    for (const [id, infos] of this.waitingPlayers) {
      if (infos.gamesettings === playerInfos.gamesettings) {
        return id;
      }
    }
    return null;
    
  }


  describeKeyBonus(key: string) : boolean{
    console.log('keybonus', key);
    if (key.includes('noBonus')) {
      return false;
    } else {
      return true;
    }
  }

  describeKeySpeed(key: string) : number {
    console.log('keyspeed', key);
    if (key.includes('4')) {
      return 4;
    } else if (key.includes('7')) {
      return 7;
    } else {
      return 10;
    }
  }

  private startMatchMatchmaking(idPlayer1: number, idPlayer2: number, player2Infos: PlayerInfos): void {
    const player1Socket: Socket = this.waitingPlayers.get(idPlayer1).socket;
    const player2Socket: Socket = player2Infos.socket;
    const settings: string = player2Infos.gamesettings;
    const bonus: boolean = this.describeKeyBonus(settings);
    const speed : number = this.describeKeySpeed(settings);
    this.waitingPlayers.delete(idPlayer1);
    const gameId: string = `${idPlayer1}-${idPlayer2}`;
    this.currentGames.set(gameId, {
      idPlayer1: idPlayer1.toString(), 
      idPlayer2: idPlayer2.toString(), 
      player1Socket: player1Socket, 
      player2Socket: player2Socket});

    // emit un event quand un match est créé
    this.matchCreated.emit('matchCreated', {
      gameId,
      idPlayer1,
      idPlayer2,
      player1Socket,
      player2Socket,
      speed,
      bonus,
    });
  }

  public waitingForInvite(gameId: string, name : number, socket: Socket, settings: string): void {
    if (this.invitationGames.has(gameId)) {
      const player1 = this.invitationGames.get(gameId);
      const player1Id: number = player1.name;
      const player1Socket: Socket = player1.socket;
      const player2Socket: Socket = socket;
      const speed: number = this.describeKeySpeed(player1.settings);
      const bonus: boolean = this.describeKeyBonus(player1.settings);
      this.invitationGames.delete(gameId);
      this.loggedInplayers.get(player1Id.toString()).isPlayerFree = true;
      this.loggedInplayers.get(name.toString()).isPlayerFree = true;
      this.currentGames.set(gameId, {
        idPlayer1: player1Id.toString(), 
        idPlayer2: name.toString(), 
        player1Socket: player1Socket, 
        player2Socket: player2Socket
        });

      this.matchCreated.emit('matchCreated', {
        gameId,
        idPlayer1: player1Id,
        idPlayer2: name,
        player1Socket: player1Socket,
        player2Socket: player2Socket,
        speed: speed,
        bonus: bonus
      });
    } else {
      this.invitationGames.set(gameId, {socket, settings, name});
      console.log('on ajoute ce gameID : ', gameId, ' avec ces settings: ', settings);
    }
  }

  public isPlayerFree(playerId: string): boolean {
    return this.loggedInplayers.get(playerId).isPlayerFree;
  }

  public setisPlayerFree(playerId: string, isFree: boolean): void {
    this.loggedInplayers.get(playerId).isPlayerFree = isFree;
  }

}

