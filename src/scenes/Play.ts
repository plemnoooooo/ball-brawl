import * as ex from "excalibur";
import { Player as PlayerData } from "../types";
import { Player } from "../actors";
import Game from "../Game";

export class Play extends ex.Scene {
    players: Map<string, Player>;
    playerUpdate: Partial<PlayerData>;

    constructor() {
        super();

        this.players = new Map();
        this.playerUpdate = {};
    }

    onInitialize(game: Game): void {
        game.socket.emitWithAck("setupPlayer", window.innerWidth, window.innerHeight, /* user input when ready */ Player.DEFAULT_USERNAME).then((player) => this.addPlayer(game.socket.id!, player));   
        game.socket.emitWithAck("retrievePlayers").then((otherPlayers) => Object.entries(otherPlayers).filter(([id]) => id !== game.socket.id).forEach(([id, player]) => this.addPlayer(id, player)));

        game.socket.on("createPlayer", this.addPlayer.bind(this));
        game.socket.on("deletePlayer", this.removePlayer.bind(this));
        game.socket.on("updatePlayers", (snapshot) => game.SI.snapshot.add(snapshot));

        this.input.pointers.on("move", ({ worldPos: { x, y } }) => {
            this.playerUpdate = { ...this.playerUpdate, x, y };
        });
    }

    update(game: Game, delta: number) {
        const snapshot = game.SI.calcInterpolation("x y");
        if (!snapshot) return;

        snapshot.state.forEach(({ id, x, y, username }) => {
            if (id === game.socket.id) return;

            const player = this.players.get(id)!;
            player.deserialize({
                x: x as number,
                y: y as number,
                username: username as string
            });
        });
        
        const player = this.players.get(game.socket.id!)!;
        player.deserialize(this.playerUpdate);

        game.socket.emit("updatePlayer", this.playerUpdate);
        this.playerUpdate = {};

        super.update(game, delta);
    }

    addPlayer(id: string, { x, y, username}: PlayerData) {
        const player = new Player(username);
        player.pos.setTo(x, y);

        this.players.set(id, player);
        this.add(player)
    }

    removePlayer(id: string) {
        this.remove(this.players.get(id)!);
        this.players.delete(id);
    }
}