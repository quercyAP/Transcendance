export interface PaddleDto {
    y?: number;
    x?: number;
}

export interface BallDto {
    x?: number;
    y?: number;
}

export interface BonusDto {
    x?: number;
    y?: number;
    isVisible?: boolean;
    color?: string;
    prevPos?: THREE.Vector2;
}

export interface GameState {
    ball?: BallDto;
    bonus?: BonusDto;
    paddles?: Record<string, PaddleDto>;
    playerId1?: string;
    playerId2?: string;
    score?: { left: number, right: number };
    isRunning?: boolean;
}

export interface PongProps  extends GameState {
    showGrid?: boolean;
}