import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { State } from "@geckos.io/snapshot-interpolation/lib/types";

import { SERVER } from "../constants";
import { Io, Player } from "../types";

export function runServerEvents(io: Io) {
    const SI = new SnapshotInterpolation();
    const players: Map<string, Player> = new Map();
    
    io.on("connect", (socket) => {
        console.log(`socket ${socket.id} has connected.`);
        socket.on("error", (error) => console.log(error.name, error.message));
        socket.on("disconnect", () => {
            console.log(`socket ${socket.id} has disconnected.`);

            socket.broadcast.emit("deletePlayer", socket.id);
            players.delete(socket.id);
        });

        socket.on("setupPlayer", (screenWidth, screenHeight, username, callback) => {
            const player = {
                x: Math.floor(Math.random() * screenWidth),
                y: Math.floor(Math.random() * screenHeight),
                username
            };

            players.set(socket.id, player);

            callback(player);
            socket.broadcast.emit("createPlayer", socket.id, player);
        });

        socket.on("updatePlayer", (player) => players.set(socket.id, { ...players.get(socket.id)!, ...player }));
        socket.on("retrievePlayers", (callback) => callback(Object.fromEntries(players.entries())));
    });

    setInterval(() => {
        const playersState: State = [];
        players.forEach(({ x, y, username }, id) => {
            playersState.push({ id, x, y, username });
        });

        const snapshot = SI.snapshot.create(playersState);
        SI.vault.add(snapshot);

        io.emit("updatePlayers", snapshot);
    }, 1000 / SERVER.FRAME_RATE);
}