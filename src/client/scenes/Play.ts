import * as ex from "excalibur";
import { SERVER, TILE } from "../../global/constants";
import { Ball as BallData, Player as PlayerData } from "../../global/types";
import { Grid } from "../../global/utils";

import { Ball, Map as MapActor, Player } from "../actors";
import Game from "../Game";

export class Play extends ex.Scene { 
    static readonly KEYS = [ex.Keys.W, ex.Keys.S, ex.Keys.A, ex.Keys.D];
    private keysDown: number = 0b0000;

    players: Map<string, Player>;
    balls: Map<string, Ball>;
    map: MapActor;

    private currentPlayer!: Player;
    private playerUpdate: Partial<PlayerData>;

    constructor() {
        super();
        
        this.players = new Map();
        this.balls = new Map();
        this.map = new MapActor(Grid.fromTiles([[0]]));
        
        this.playerUpdate = {};
    }

    onInitialize(game: Game): void {
        this.currentPlayer = new Player();
        this.currentPlayer.on("collisionstart", ({ other }) => {
            if (!other.hasTag(Ball.TAG_NAME)) return;

            const [id, ball] = Array.from(this.balls.entries()).find(([_, { id }]) => id === other.id)!; 
            this.currentPlayer.collectedBalls.push(id);
            ball.collect();

            game.socket.emit("collectBall", id);
        });

        this.camera.addStrategy(new ex.LockCameraToActorStrategy(this.currentPlayer));

        this.add(this.currentPlayer);
        this.add(this.map);
        
        game.socket.emitWithAck("retrieveData").then(({ players, balls, map }) => {
            Object.entries(players).filter(([id]) => id !== game.socket.id!).forEach(([id, player]) => this.addPlayer(id, player));
            Object.entries(balls).forEach(([id, ball]) => this.addBall(id, ball));

            const tiles = Grid.fromTiles(map);
            this.map.setMap(tiles);
        });

        game.socket.emitWithAck("setupPlayer", /* user input when ready */ Player.DEFAULT_USERNAME).then((player) => this.currentPlayer.deserialize(player));

        game.socket.on("update", (snapshot) => game.SI.snapshot.add(snapshot));

        game.socket.on("createPlayer", this.addPlayer.bind(this));
        game.socket.on("deletePlayer", this.removePlayer.bind(this));

        game.socket.on("createBall", this.addBall.bind(this));
        game.socket.on("deleteBall", this.removeBall.bind(this));

        this.input.keyboard.on("press", ({ key }) => this.keysDown |= Math.floor(0b10 ** Play.KEYS.indexOf(key)));
        this.input.keyboard.on("release", ({ key }) => this.keysDown ^= Math.floor(0b10 ** Play.KEYS.indexOf(key)));
    }

    update(game: Game, delta: number) {
        const playerSnapshot = game.SI.calcInterpolation("x y", "players");
        playerSnapshot && playerSnapshot.state.forEach(({ id, x, y, username }) => {
            if (id === game.socket.id) return;

            this.players.get(id)?.deserialize({
                x: x as number,
                y: y as number,
                username: username as string
            });
        });

        const ballSnapshot = game.SI.calcInterpolation("x y", "balls");
        ballSnapshot && ballSnapshot.state.forEach(({ id, x, y, hidden, isProjectile, direction, startSpeed }) => {
            this.balls.get(id)?.deserialize(Object.assign({
                x: x as number,
                y: y as number,
            }, this.currentPlayer.collectedBalls.concat(this.currentPlayer.thrownBalls).includes(id) ? {
                direction: direction as number, 
                startSpeed: startSpeed as number
            } : {
                hidden: !!hidden,
                isProjectile: !!isProjectile
            }));
        });

        const calculatedDelta = delta / (1000 / SERVER.TICK_RATE);

        let { x, y } = ((!this.keysDown && this.input.pointers.isDown(0)) ? this.input.pointers.primary.lastScreenPos.sub(ex.vec(game.halfDrawWidth, game.halfDrawHeight)) : this.getMovementFromKey()).clampMagnitude(1).scaleEqual(Player.MAX_SPEED * calculatedDelta).add(this.currentPlayer.pos);
        this.playerUpdate = { ...this.playerUpdate, x, y };
        
        this.currentPlayer.deserialize(this.playerUpdate);
        game.socket.emit("updatePlayer", this.playerUpdate);
        this.playerUpdate = {};

        this.currentPlayer.thrownBalls.forEach((id) => {
            const { x, y } = this.balls.get(id)!.serialize();
            game.socket.emit("updateBall", id, { x, y });
        });

        super.update(game, delta);
    }

    private addPlayer(id: string, { x, y, username }: PlayerData) {
        const player = new Player(username);
        [x, y] = this.map.offsetVectorByBorder([x, y]);
        player.pos.setTo(x + TILE.WIDTH, y + TILE.HEIGHT);

        this.players.set(id, player);
        this.add(player);
    }

    private removePlayer(id: string) {
        this.players.get(id)!.kill();
        this.players.delete(id);
    }

    private addBall(id: string, { x, y, isProjectile, direction, hidden, startSpeed }: BallData) {
        const ball = new Ball(isProjectile, direction, startSpeed, hidden);
        [x, y] = this.map.offsetVectorByBorder([x, y]);
        ball.pos.setTo(x, y);

        this.balls.set(id, ball);
        this.add(ball);
    }

    private removeBall(id: string) {
        this.balls.get(id)!.kill()
        this.balls.delete(id);
    }

    private getMovementFromKey(): ex.Vector {
        return [ex.Vector.Up, ex.Vector.Down, ex.Vector.Left, ex.Vector.Right].reduce((v1, v2, i) => v1.add(v2.scale((this.keysDown & (0b10 ** i)) >> i)), ex.Vector.Zero);
    }
}