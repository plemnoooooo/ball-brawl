import { Snapshot } from "@geckos.io/snapshot-interpolation/lib/types";
import { Player } from ".";

export interface Io {
    createPlayer(id: string, player: Player): void;
    deletePlayer(id: string): void;
    updatePlayers(snapshot: Snapshot): void;
}

export interface Socket {
    setupPlayer(screenWidth: number, screenHeight: number, username: string, callback: (player: Player) => void): void;
    updatePlayer(player: Partial<Player>): void;
    retrievePlayers(callback: (players: Record<string, Player>) => void): void;
}