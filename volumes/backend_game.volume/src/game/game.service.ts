// game.service.ts
import { Injectable } from '@nestjs/common';
import { clear } from 'console';
import { Engine, Bodies, World, Body } from 'matter-js';
import Matter = require('matter-js');
import { EventEmitter } from 'events';
import { HttpService } from '@nestjs/axios';

interface Paddle {
  body: Body;
}

interface Ball {
  body: Body;
  speedMultiplier: number;
  speed: number;
  velocityTimeoutId?: ReturnType<typeof setTimeout>;
}

interface Bonus {
  body: Body;
  isVisible: boolean;
  color?: string;
  prevPos?: { x: number; y: number };
}

interface GameState {
  ball: Ball;
  bonus: Bonus;
  paddles: Record<string, Paddle>;
  walls: Record<string, Body>;
  playerId1: string;
  playerId2: string;
  score: { left: number; right: number };
  mouseY: number;
  isRunning: boolean;
}

@Injectable()
export class GameService {
  private engines: Map<string, Engine> = new Map();
  private games: Map<string, GameState> = new Map();
  public matchEnded = new EventEmitter();
  private ratio: number = 8;
  private GAME_WIDTH = 100;
  private GAME_HEIGHT = 60;
  private GAME_GOAL = 5;
  //private GAME_SPEED = 7;

  constructor(
    private readonly httpService: HttpService,
  ) {}

  private checkcollsion(gameId: string) {
    const game = this.games.get(gameId);
    Matter.Events.on(this.engines.get(gameId), 'collisionStart', (event) => {
      event.pairs.forEach((collision) => {
        const labels = ['ball', 'left-goal', 'right-goal'];
        const bonus = ['ball', 'invert', 'jump', 'speed', 'slow'];
        if (
          labels.includes(collision.bodyA.label) &&
          labels.includes(collision.bodyB.label)
        ) {
          if (
            collision.bodyA.label === 'left-goal' ||
            collision.bodyB.label === 'left-goal'
          ) {
            this.incrementScore('right', gameId);
          } else {
            this.incrementScore('left', gameId);
          }
          if( game.score.left === this.GAME_GOAL ){
            this.endGame(gameId, game.playerId1, game.score.left, game.playerId2, game.score.right);
          } else if (game.score.right === this.GAME_GOAL){
            this.endGame(gameId, game.playerId2, game.score.right, game.playerId1, game.score.left);
          } else {
            this.resetBall(gameId);
          }  
        } else if (
          bonus.includes(collision.bodyA.label) &&
          bonus.includes(collision.bodyB.label)
        ) {
          const bonusBody =
            collision.bodyA.label === 'ball'
              ? collision.bodyB
              : collision.bodyA;
          if (bonusBody.label === 'invert') {
            this.invertballVelocity(gameId);
          } else if (bonusBody.label === 'jump') {
            this.jumpBall(gameId);
          } else if (bonusBody.label === 'speed') {
            this.speedball(gameId);
          }
          game.bonus.isVisible = false;
          game.bonus.prevPos.x =
            game.bonus.body.position.x;
          game.bonus.prevPos.y =
            game.bonus.body.position.y;
          World.remove(
            this.engines.get(gameId).world,
            game.bonus.body,
          );
          this.createBonus(gameId);
        }
      });
    });
  }

  createGame(gameId: string, playerId1: string, playerId2: string, bonus: boolean, speed: number) {
    this.engines.set(gameId, Engine.create());
    this.engines.get(gameId).world.gravity.y = 0;
    const wallOptions = { isStatic: true, restitution: 1 };

    const walls = {
      topWall: Bodies.rectangle(
        0,
        -(this.GAME_HEIGHT / 2) * this.ratio,
        this.GAME_WIDTH * this.ratio,
        2,
        wallOptions,
      ),
      bottomWall: Bodies.rectangle(
        0,
        (this.GAME_HEIGHT / 2) * this.ratio,
        this.GAME_WIDTH * this.ratio,
        2,
        wallOptions,
      ),
      leftWall: Bodies.rectangle(
        (-this.GAME_WIDTH / 2) * this.ratio,
        0,
        2,
        this.GAME_HEIGHT * this.ratio,
        {
          ...wallOptions,
          label: 'left-goal',
        },
      ),
      rightWall: Bodies.rectangle(
        (this.GAME_WIDTH / 2) * this.ratio,
        0,
        2,
        this.GAME_HEIGHT * this.ratio,
        {
          ...wallOptions,
          label: 'right-goal',
        },
      ),
    };

    const gameState = {
      ball: {
        body: Bodies.rectangle(0, 0, 4 * this.ratio, 4 * this.ratio, {
          restitution: 1,
          friction: 0,
          inertia: Infinity,
          frictionAir: 0,
          label: 'ball',
        }),
        speedMultiplier: 1,
        speed: speed,
      },
      bonus: {
        body: Bodies.rectangle(0, 0, 6 * this.ratio, 6 * this.ratio, {
          isStatic: true,
          isSensor: true,
          restitution: 0,
          label: 'bonus',
        }),
        isVisible: false,
        prevPos: { x: 0, y: 0 },
      },
      paddles: {
        [playerId1]: {
          body: Bodies.rectangle(
            -((this.GAME_WIDTH * this.ratio) / 2) + 4 * this.ratio,
            0,
            4 * this.ratio,
            12 * this.ratio,
            {
              isStatic: true,
              restitution: 1,
            },
          ),
        },
        [playerId2]: {
          body: Bodies.rectangle(
            (this.GAME_WIDTH * this.ratio) / 2 - 4 * this.ratio,
            0,
            4 * this.ratio,
            12 * this.ratio,
            {
              isStatic: true,
              restitution: 1,
            },
          ),
        },
      },
      walls: walls,
      playerId1: playerId1,
      playerId2: playerId2,
      score: { left: 0, right: 0 },
      mouseY: 0,
      isRunning: true,
    };

    //adjust speed
    //this.GAME_SPEED = speed;

    Body.setVelocity(gameState.ball.body, {
      x: (Math.random() > 0.5 ? 1 : -1) * gameState.ball.speed,
      y: (Math.random() > 0.5 ? 1 : -1) * gameState.ball.speed,
    });

    World.add(this.engines.get(gameId).world, [
      walls.topWall,
      walls.bottomWall,
      walls.leftWall,
      walls.rightWall,
      gameState.ball.body,
      gameState.paddles[playerId1].body,
      gameState.paddles[playerId2].body,
    ]);

    this.games.set(gameId, gameState);

    if (bonus){
      this.createBonus(gameId);
    }
   

    this.checkcollsion(gameId);
  }

  updateGameState(gameId: string) {
    const engine = this.engines.get(gameId);
    Engine.update(engine);
  }

  private resetBall(gameId: string) {
    const gameState = this.games.get(gameId);

    Body.setPosition(gameState.ball.body, { x: 0, y: 0 });
    Body.setVelocity(gameState.ball.body, {
      x: (Math.random() > 0.5 ? 1 : -1) * gameState.ball.speed,
      y: (Math.random() > 0.5 ? 1 : -1) * gameState.ball.speed,
    });
    gameState.ball.speedMultiplier = 1;
    clearTimeout(gameState.ball.velocityTimeoutId);
    gameState.ball.velocityTimeoutId = undefined;
  }

  private incrementScore(player: 'left' | 'right', gameId: string) {
    if (player === 'left') {
      this.games.get(gameId).score.left += 1;
    } else if (player === 'right') {
      this.games.get(gameId).score.right += 1;
    }
  }

  private createBonus(gameId: string) {
    const gameState = this.games.get(gameId);
    if (gameState.bonus.isVisible) {
      return;
    }

    const bonusTypes = [
      { label: 'invert', color: 'orange' },
      { label: 'jump', color: 'green' },
      { label: 'speed', color: 'blue' },
    ];
    const bonusSelected =
      bonusTypes[Math.floor(Math.random() * bonusTypes.length)];

    const x = (Math.random() - 0.5) * 2 * (this.GAME_WIDTH * 0, 8) * this.ratio;
    const y =
      (Math.random() - 0.5) * 2 * (this.GAME_HEIGHT * 0, 8) * this.ratio;
    Matter.Body.setPosition(gameState.bonus.body, { x: x, y: y });
    gameState.bonus.body.label = bonusSelected.label;
    gameState.bonus.color = bonusSelected.color;

    World.add(this.engines.get(gameId).world, [gameState.bonus.body]);
    gameState.bonus.isVisible = true;
  }

  private invertballVelocity(gameId: string) {
    const gameState = this.games.get(gameId);
    const ball = gameState.ball.body;
    const x = ball.velocity.x;
    const y = ball.velocity.y;
    Body.setVelocity(ball, { x: -x, y: -y });
  }

  private jumpBall(gameId: string) {
    const gameState = this.games.get(gameId);
    const newX =
      (Math.random() - 0.5) * 2 * (this.GAME_WIDTH * this.ratio * 0, 8);
    const newY =
      (Math.random() - 0.5) * 2 * (this.GAME_HEIGHT * 0, 8 * this.ratio);
    Body.setPosition(gameState.ball.body, { x: newX, y: newY });
  }

  private speedball(gameId: string) {
    const ball = this.games.get(gameId).ball;

    if (ball.velocityTimeoutId) {
      clearTimeout(ball.velocityTimeoutId);
    }

    this.adjustBallVelocity(gameId, 1.5);

    ball.velocityTimeoutId = setTimeout(() => {
      this.adjustBallVelocity(gameId, 1);
    }, 2000);
  }

  private adjustBallVelocity(gameId: string, newMultiplier: number) {
    const ball = this.games.get(gameId).ball;

    const adjustedVelocity = {
      x: (ball.body.velocity.x * newMultiplier) / ball.speedMultiplier,
      y: (ball.body.velocity.y * newMultiplier) / ball.speedMultiplier,
    };
    Matter.Body.setVelocity(ball.body, adjustedVelocity);

    ball.speedMultiplier = newMultiplier;
  }

  handlePlayerAction(playerId: string, direction: string, gameId: string) {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      console.log('gameState not found');
      return;
    }
    const paddle = gameState.paddles[playerId];
    const movement = direction === 'down' ? -7 : 7;

    Body.setPosition(paddle.body, {
      x: paddle.body.position.x,
      y: Math.max(
        (-(this.GAME_HEIGHT / 2) + 6) * this.ratio,
        Math.min(
          (this.GAME_HEIGHT / 2 - 6) * this.ratio,
          paddle.body.position.y + movement,
        ),
      ),
    });
  }

  handleMouse(
    winHeight: number,
    move: number,
    playerId: number,
    gameId: string,
  ) {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      //console.log('gameState dans handlmouse not found');
      return;
    }

    const paddle = gameState.paddles[playerId];
    const movement = move * -winHeight; ///cree un bon mouvement
    Body.setPosition(paddle.body, {
      x: paddle.body.position.x,
      y: Math.max(
        (-(this.GAME_HEIGHT / 2) + 6) * this.ratio,
        Math.min(
          (this.GAME_HEIGHT / 2 - 6) * this.ratio,
          //paddle.body.position.y - movement,
          movement,
        ),
      ),
    });
  }

  async sendMatchResult(winner: string, scoreWinner: number, loser: string, scoreLoser: number) : Promise<any> {
    const matchResult = {
      winnerId: winner,
      winnerScore: scoreWinner,
      loserId: loser,
      loserScore: scoreLoser,
    };

    return this.httpService.axiosRef
      .post('http://backend:3001/history', matchResult)
      .then((res) => res.data)
      .catch((err) => {
        console.log('error', err.message);
        throw new Error(
          err?.message + ': ' + JSON.stringify(err?.response?.data),
          );
      });
  }


  endGame(gameId: string, winner: string, scoreWinner: number, loser: string, scoreLoser: number) {
    console.log('end game');
    this.games.get(gameId).isRunning = false;
    this.matchEnded.emit('matchEnded', { gameId, winner, scoreWinner, loser, scoreLoser });
    this.sendMatchResult(winner, scoreWinner, loser, scoreLoser);
    //this.deleteGame(gameId);

  }


  deleteGame(gameId: string) {
    // mettre le resultat dans le backend

    Engine.clear(this.engines.get(gameId));
    this.engines.delete(gameId);
    // this.games.delete(gameId);
  }

  getGameState(gameId: string) {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      console.log('gameState not found dans get gamestate');
      return null;
    }

    return {
      ball: {
        x: gameState.ball.body.position.x / this.ratio,
        y: gameState.ball.body.position.y / this.ratio,
      },
      bonus: {
        x: gameState.bonus.body.position.x / this.ratio,
        y: gameState.bonus.body.position.y / this.ratio,
        isVisible: gameState.bonus.isVisible,
        color: gameState.bonus.color,
        prevPos: {
          x: gameState.bonus.prevPos.x / this.ratio,
          y: gameState.bonus.prevPos.y / this.ratio,
        },
      },
      paddles: {
        [gameState.playerId1]: {
          x:
            gameState.paddles[gameState.playerId1].body.position.x / this.ratio,
          y:
            gameState.paddles[gameState.playerId1].body.position.y / this.ratio,
        },
        [gameState.playerId2]: {
          x:
            gameState.paddles[gameState.playerId2].body.position.x / this.ratio,
          y:
            gameState.paddles[gameState.playerId2].body.position.y / this.ratio,
        },
      },
      score: gameState.score,
      playerId1: gameState.playerId1,
      playerId2: gameState.playerId2,
      mouseY: gameState.mouseY,
      isRunning: gameState.isRunning,
    };
  }
}

