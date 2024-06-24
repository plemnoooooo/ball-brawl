import * as ex from "excalibur";
import { BALL, TILE } from "../../global/constants";
import { Ball as BallData, Player as PlayerData, Vector } from "../../global/types";
import { Grid, isNumberInRange, Random } from "../../global/utils";

import { Ball, Map as MapActor, Player } from "../actors";
import Game from "../Game";
import { BallCounter, ThrowButton } from "../ui";

export class Play extends ex.Scene { 
    static readonly RESOLVE_COLLISION_LOOPS = 8;
    static readonly KEYS = [ex.Keys.W, ex.Keys.S, ex.Keys.A, ex.Keys.D];
    
    private keysDown: number = 0b0000;
    private firstPointerPos!: ex.Vector;
    private now!: number;

    declare engine: Game;

    players: Map<string, Player>;
    balls: Map<string, Ball>;
    map!: MapActor;

    private currentPlayer!: Player;
    private playerUpdate: Partial<PlayerData>;
    
    private ballCounter!: BallCounter;
    private throwButton!: ThrowButton;

    constructor() {
        super();
        
        this.players = new Map();
        this.balls = new Map();
        
        this.playerUpdate = {};
    }

    onInitialize(game: Game) {
        this.ballCounter = new BallCounter();
        this.throwButton = new ThrowButton();
        this.throwButton.on("pointerdown", this.throwBall.bind(this));
        
        this.add(this.ballCounter);
        this.add(this.throwButton);
        
        game.socket.emitWithAck("retrieveData").then(({ players, balls, map }) => {
            Object.entries(players).filter(([id]) => id !== game.socket.id!).forEach(([id, player]) => this.addPlayer(id, player));
            Object.entries(balls).forEach(([id, ball]) => this.addBall(id, ball));

            const tiles = Grid.fromTiles(map);
            this.map = new MapActor(tiles);
            this.add(this.map);
        });

        game.socket.emitWithAck("setupPlayer", /* user input when ready */ game.socket.id || Player.DEFAULT_USERNAME).then(({ x, y, username }) => {
            this.currentPlayer = new Player(username);
            this.currentPlayer.pos.setTo(x, y);
            this.currentPlayer.on("collisionstart", ({ other }) => {
                if (!other.hasTag(Ball.TAG_NAME) || this.currentPlayer.stunned) return;

                const balls = Array.from(this.balls.entries());
                const [id, ball] = balls.find(([_, { id }]) => id === other.id)!;
                if (!id) return;

                if (ball.isProjectile) {
                    if (ball.owner === game.socket.id) return;
                    
                    this.currentPlayer.stunned = true;
                    setTimeout(() => this.currentPlayer.stunned = false, Player.STUNNED_DURATION);

                    const dispersedBalls = Random.select(this.currentPlayer.collectedBalls, Random.number(Ball.DISPERSE_AMOUNT_MAX, Ball.DISPERSE_AMOUNT_MIN)).reduce((balls, id) => {
                        let { x, y } = this.currentPlayer.pos;
                        x /= TILE.WIDTH;
                        y /= TILE.HEIGHT;

                        const ball: Omit<Omit<BallData, "isProjectile">, "owner"> = {
                            x,
                            y,

                            direction: Random.number(2 * Math.PI, 0, false),
                            startSpeed: Random.number(Ball.DISPERSE_SPEED_MAX, Ball.DISPERSE_SPEED_MIN)
                        };

                        this.addBall(id, {
                            ...ball,
                            isProjectile: false,
                            owner: game.socket.id!
                        });

                        balls[id] = ball;
                        this.currentPlayer.collectedBalls.splice(this.currentPlayer.collectedBalls.indexOf(id), 1);

                        return balls;
                    }, {} as Record<string, Omit<Omit<BallData, "isProjectile">, "owner">>);

                    game.socket.emit("hitByBall", dispersedBalls);
                    this.ballCounter.count -= Object.keys(dispersedBalls).length;

                    return;
                }

                this.currentPlayer.collectedBalls.push(id);
                this.removeBall(id);

                game.socket.emit("collectBall", id);
                this.ballCounter.count++;
            });
            
            this.camera.addStrategy(new ex.LockCameraToActorStrategy(this.currentPlayer));

            this.add(this.currentPlayer);
        });

        game.socket.on("update", (snapshot) => game.SI.snapshot.add(snapshot));

        game.socket.on("createPlayer", this.addPlayer.bind(this));
        game.socket.on("deletePlayer", this.removePlayer.bind(this));

        game.socket.on("createBall", this.addBall.bind(this));
        game.socket.on("deleteBall", this.removeBall.bind(this));

        this.input.keyboard.on("press", ({ key }) => {
            if (key === ex.Keys.Space) this.throwBall();

            const i = Play.KEYS.indexOf(key);
            this.keysDown ^= (i < 0) ? 0 : (0b10 ** i);
        });

        this.input.keyboard.on("release", ({ key }) => {
            const i = Play.KEYS.indexOf(key);
            this.keysDown ^= (i < 0) ? 0 : (0b10 ** i);

            return;
        });

        this.firstPointerPos = ex.vec(-1, -1);
        this.input.pointers.primary.on("down", ({ screenPos: { x, y } }) => this.firstPointerPos.equals(ex.vec(-1, -1)) && this.firstPointerPos.setTo(x, y));
        this.input.pointers.primary.on("up", () => this.firstPointerPos.setTo(-1, -1));

        this.now = Date.now();
        setInterval(() => this.gameUpdate(game), 0);
    }

    gameUpdate(game: Game) {
        const now = Date.now();
        const delta = now - this.now;
        
        super.update(game, delta);
        this.now = now;

        const playerSnapshot = game.SI.calcInterpolation("x y", "players");
        playerSnapshot && playerSnapshot.state.forEach(({ id, x, y, username, stunned }) => {
            (id !== game.socket.id) && this.players.get(id)?.deserialize({
                x: x as number,
                y: y as number,
                username: username as string,
                stunned: !!stunned
            });
        });

        const ballSnapshot = game.SI.calcInterpolation("x y", "balls");
        ballSnapshot && ballSnapshot.state.forEach(({ id, x, y, isProjectile, owner }) => {
            (owner !== game.socket.id) && this.balls.get(id)?.deserialize({
                x: x as number,
                y: y as number,
                isProjectile: !!isProjectile,
                owner: owner as string
            });
        });

        if (!this.currentPlayer) return;

        const {
            x: px,
            y: py
        } = this.firstPointerPos;
        this.currentPlayer.vel = this.currentPlayer.stunned ? ex.Vector.Zero : ((!this.keysDown && this.input.pointers.isDown(ex.NativePointerButton.Left) && !this.throwButton.contains(px, py)) ? this.getVelocityFromPointer() : this.getVelocityFromKeys()).clampMagnitude(1).scaleEqual(Player.MOVE_SPEED);
        
        let { x, y, stunned } = this.currentPlayer.serialize();
        if (!this.map.isNumberInTileRange(this.map.tiles.get(x / TILE.WIDTH, y / TILE.HEIGHT))) [x, y] = this.resolveMapCollision(x, y);
        this.playerUpdate = { ...this.playerUpdate, x, y, stunned };
        
        this.currentPlayer.deserialize(this.playerUpdate);
        game.socket.emit("updatePlayer", this.playerUpdate);
        this.playerUpdate = {};

        Array.from(this.balls.entries()).filter(([_, { owner }]) => owner === game.socket.id).forEach(([id, ball]) => {
            let { x, y, isProjectile } = ball.serialize();

            if (!this.map.isNumberInTileRange(this.map.tiles.get(x / TILE.WIDTH, y / TILE.HEIGHT))) [x, y] = this.resolveMapCollision(x, y);
            ball.pos.setTo(x, y);

            game.socket.emit("updateBall", id, { x, y, isProjectile });
        });
    }

    private addPlayer(id: string, { x, y, username }: PlayerData) {
        const player = new Player(username);
        player.pos.setTo(x * TILE.WIDTH, y * TILE.HEIGHT);

        this.players.set(id, player);
        this.add(player);
    }

    private removePlayer(id: string) {
        this.players.get(id)?.kill();
        this.players.delete(id);
    }

    private addBall(id: string, { x, y, isProjectile, owner, direction, startSpeed }: BallData) {
        const ball = new Ball(isProjectile, owner, direction, startSpeed);
        ball.pos.setTo(x * TILE.WIDTH, y * TILE.HEIGHT);

        this.balls.set(id, ball);
        this.add(ball);
    }

    private removeBall(id: string) {
        this.balls.get(id)?.kill();
        this.balls.delete(id);
    }

    private throwBall() {
        const id = this.currentPlayer?.collectedBalls.splice(Random.number(this.currentPlayer.collectedBalls.length), 1)[0];
        if (!id) return;
        
        const { x, y } = this.currentPlayer.pos.clone().scale(ex.vec(1 / TILE.WIDTH, 1 / TILE.HEIGHT));
        const direction = this.getVelocityFromPointer().toAngle();
        this.addBall(id, {
            x,
            y,

            isProjectile: true,
            owner: this.engine.socket.id!,
            direction,
            startSpeed: BALL.THROW_SPEED
        });

        this.engine.socket.emit("throwBall", id, direction);
        this.ballCounter.count--;
    }

    private getVelocityFromKeys(): ex.Vector {
        return [ex.Vector.Up, ex.Vector.Down, ex.Vector.Left, ex.Vector.Right].reduce((v1, v2, i) => v1.add(v2.scale((this.keysDown & (0b10 ** i)) >> i)), ex.Vector.Zero);
    }

    private getVelocityFromPointer(): ex.Vector {
        return this.input.pointers.primary.lastScreenPos.sub(ex.vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight));
    }

    private resolveMapCollision(x: number, y: number): Vector {
        const queue: Vector[] = [[x / TILE.WIDTH, y / TILE.HEIGHT]];
        for (const _ of Array(Play.RESOLVE_COLLISION_LOOPS).keys()) {
            const queuedTiles: Vector[] = [];

            for (const i of queue.keys()) {
                let [tx, ty] = queue.splice(i, 1)[0];
                tx = isNumberInRange(tx, 0, this.map.mapWidth - 1, true);
                ty = isNumberInRange(ty, 0, this.map.mapHeight - 1, true);

                const { up, down, left, right } = this.map.tiles.getAdjacentTiles(tx, ty, false);

                if ((up === undefined) || this.map.isNumberInTileRange(up)) return [tx * TILE.WIDTH, (ty - 1) * TILE.HEIGHT];
                else queuedTiles.push([tx, ty - 1]);

                if ((down === undefined) || this.map.isNumberInTileRange(down)) return [tx * TILE.WIDTH, (ty + 1) * TILE.HEIGHT];
                else queuedTiles.push([tx, ty + 1]);

                if ((left === undefined) || this.map.isNumberInTileRange(left)) return [(tx - 1) * TILE.WIDTH, ty * TILE.HEIGHT];
                else queuedTiles.push([tx - 1, ty]);

                if ((right === undefined) || this.map.isNumberInTileRange(right)) return [(tx + 1) * TILE.WIDTH, ty * TILE.HEIGHT];
                else queuedTiles.push([tx + 1, ty]);
            }

            queue.push(...queuedTiles);
        }

        return [x, y];
    }
}