export interface Room {
    maxSockets: number;
    mapWidth: number;
    mapHeight: number;
    createBallRate?: number;
    maxBalls?: number;
}