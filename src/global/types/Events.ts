import { Snapshot } from "@geckos.io/snapshot-interpolation/lib/types";
import { Ball, Player } from ".";

export interface Io {
    update(snapshot: Snapshot): void;

    createPlayer(id: string, player: Player): void;
    deletePlayer(id: string): void;
    
    createBall(id: string, ball: Ball): void;
    deleteBall(id: string): void;
}

export interface Socket {
    retrieveData(callback: (data: {
        players: Record<string, Player>,
        balls: Record<string, Ball>,
        map: number[][]
    }) => void): void
    
    setupPlayer(username: string, callback: (player: Player) => void): void;
    updatePlayer(player: Partial<Player>): void;
    
    collectBall(id: string): void;
    throwBall(direction: number): void;
    hitByBall(id: string, callback: (balls: string[]) => void): void;
    updateBall(id: string, ball: Partial<Ball>): void;
}