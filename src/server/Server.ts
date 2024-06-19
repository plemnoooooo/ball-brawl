import { Socket } from "socket.io";
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { State } from "@geckos.io/snapshot-interpolation/lib/types";

import { BALL, MAP, SERVER, TILE } from "../global/constants";
import { Player, Ball, Vector, Events } from "../global/types";
import { findAverage, isNumberInRange, Random } from "../global/utils";

import { Io } from "./types";
import { Perlin } from "./utils"; 

export default class Server {
    static readonly CREATE_BALL_PERIOD_LENGTH = 8;
    static readonly MAX_BALL_LIMIT = 80;

    private players: Map<string, Player> = new Map();
    private balls: Map<string, Ball> = new Map();
    private map: Perlin;

    private tick: number;
    constructor(public io: Io, public SI: SnapshotInterpolation) {
        this.players = new Map();
        this.balls = new Map();
        this.map = new Perlin(MAP.WIDTH, MAP.HEIGHT);

        this.tick = 0;
    }

    start() {
        this.io.on("connect", this.onSocketJoin.bind(this));
        setInterval(this.update.bind(this), 1000 / SERVER.TICK_RATE);
    }

    update() {
        this.tick++;

        (!this.isTickInPeriod(Server.CREATE_BALL_PERIOD_LENGTH) && (Array(this.balls.keys()).length < Server.MAX_BALL_LIMIT)) && this.createBall();

        const worldState = this.getWorldState();

        const snapshot = this.SI.snapshot.create(worldState);
        this.SI.vault.add(snapshot);

        !this.isTickInPeriod(1 / SERVER.IO_EMIT_RATE) && this.io.emit("update", snapshot);
    }

    onSocketJoin(socket: Socket<Events.Socket, Events.Io>) {
        let player: Player;

        socket.on("disconnect", () => {
            socket.broadcast.emit("deletePlayer", socket.id);

            this.players.get(socket.id)!.thrownBalls.forEach((id) => this.balls.delete(id));
            this.players.delete(socket.id);
        });

        socket.on("retrieveData", (callback) => callback({
            players: Object.fromEntries(this.players.entries()),
            balls: Object.fromEntries(this.balls.entries()), 
            map: this.map.tiles.raw()
        }));

        socket.on("setupPlayer", (username, callback) => {
            const [x, y] = this.getRandomVector();
            const createdPlayer: Player = {
                x,
                y,
                username,
                collectedBalls: [],
                thrownBalls: []
            };

            player = createdPlayer;
            this.players.set(socket.id, player);

            callback(player);
            socket.broadcast.emit("createPlayer", socket.id, player);
        });

        socket.on("updatePlayer", (player) => this.players.set(socket.id, { ...this.players.get(socket.id)!, ...player }));

        socket.on("collectBall", (id) => {
            this.balls.delete(id);
            player.collectedBalls.push(id);
        });

        socket.on("throwBall", (id, direction, startSpeed = BALL.START_SPEED) => {
            const ball = {
                x: player.x,
                y: player.y,
            
                isProjectile: true, 
                direction,
                startSpeed
            };

            this.balls.set(id, ball);
        });

        socket.on("hitByBall", (hitBallId, dispersedBalls) => {
            let ball = this.balls.get(hitBallId)!;
            ball = {
                ...ball,
                isProjectile: false,
                startSpeed: 0
            };
            
            const thrower = Array.from(this.players.entries()).find(([_, { collectedBalls }]) => collectedBalls.includes(hitBallId))![1];
            thrower.collectedBalls.splice(thrower.collectedBalls.findIndex((id) => id === hitBallId), 1);

            Object.entries(dispersedBalls).forEach(([id, { direction, startSpeed }]) => {
                direction ??= 0;
                startSpeed ??= BALL.START_SPEED;

                const ball: Ball = {
                    x: player.x,
                    y: player.y,

                    isProjectile: false,
                    direction,
                    startSpeed
                };

                this.balls.set(id, ball);
                player.collectedBalls.splice(player.collectedBalls.findIndex((ballId) => ballId === id), 1);
            });
        });
    }

    private isTickInPeriod(period: number) {
        return this.tick % (SERVER.TICK_RATE * period);
    }

    private getWorldState(): Record<string, State> {
        const playersState: State = [];
        this.players.forEach((player, id) => playersState.push({
            ...player,
            id,

            collectedBalls: player.collectedBalls.toString(),
            thrownBalls: player.thrownBalls.toString()
        }));

        const ballsState: State = [];
        this.balls.forEach((ball, id) => ballsState.push({
            ...ball,
            id,
            isProjectile: +ball.isProjectile
        }));

        return {
            players: playersState,
            balls: ballsState
        };
    }

    private createBall() {
        const id = Random.generateBase64();
        const [x, y] = this.getRandomVector();
        const ball: Ball = {
            x,
            y,

            isProjectile: false,
            direction: 0,
            startSpeed: 0
        };

        this.balls.set(id, ball);
        this.io.emit("createBall", id, ball);
    }

    private getRandomVector(noCollisionWithTiles: boolean = true): Vector {
        let x = Random.number(MAP.WIDTH * TILE.WIDTH);
        let y = Random.number(MAP.HEIGHT * TILE.HEIGHT);

        if (!noCollisionWithTiles) return [x, y];
        
        const averageTileWeight = findAverage(this.map.tiles.raw(true));
        while (!isNumberInRange(this.map.tiles.get(x / TILE.WIDTH, y / TILE.HEIGHT), averageTileWeight - TILE.OFFSET.MIN, averageTileWeight + TILE.OFFSET.MAX)) {
            x = Random.number(MAP.WIDTH * TILE.WIDTH);
            y = Random.number(MAP.HEIGHT * TILE.HEIGHT);
        }

        return [x, y];
    }
}