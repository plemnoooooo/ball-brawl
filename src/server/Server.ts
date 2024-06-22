import { Socket } from "socket.io";
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { State } from "@geckos.io/snapshot-interpolation/lib/types";

import { BALL, MAP, SERVER, TILE } from "../global/constants";
import { Player, Ball, Vector, Events } from "../global/types";
import { findAverage, isNumberInRange, Random } from "../global/utils";

import { Io } from "./types";
import { Perlin } from "./utils"; 

export default class Server {
    static readonly CREATE_BALL_TICKS = 1;
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

        if (!this.isTickInPeriod(Server.CREATE_BALL_TICKS) && (Array.from(this.balls.keys()).length < Server.MAX_BALL_LIMIT)) {
            const id = Random.generateBase64();
            const [x, y] = this.getRandomVector();
            const ball: Ball = {
                x,
                y,

                isProjectile: false,
                owner: "",
                direction: 0,
                startSpeed: 0
            };

            this.balls.set(id, ball);
            this.io.emit("createBall", id, ball);
        }

        const worldState = this.getWorldState();

        const snapshot = this.SI.snapshot.create(worldState);
        this.SI.vault.add(snapshot);

        !this.isTickInPeriod(1 / SERVER.IO_EMIT_RATE) && this.io.emit("update", snapshot);
    }

    onSocketJoin(socket: Socket<Events.Socket, Events.Io>) {
        let player: Player;

        socket.on("disconnect", () => {
            socket.broadcast.emit("deletePlayer", socket.id);

            this.players.delete(socket.id);
            Array.from(this.balls.entries()).filter(([_, { owner }]) => owner === socket.id).forEach(([id]) => {
                const ball = this.balls.get(id);
                
                if (!ball) return;
                ball.owner = "";
            });
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
                stunned: false,
                collectedBalls: []
            };

            player = createdPlayer;
            this.players.set(socket.id, player);

            callback(player);
            socket.broadcast.emit("createPlayer", socket.id, player);
        });

        socket.on("updatePlayer", (playerData) => this.players.set(socket.id, { ...player, ...playerData }));
        socket.on("updateBall", (id, ball) => this.balls.set(id, { ...this.balls.get(id)!, ...ball }));

        socket.on("collectBall", (id) => {
            this.balls.delete(id);
            socket.broadcast.emit("deleteBall", id);
        });

        socket.on("throwBall", (id, direction) => {
            const { x, y } = player;
            const ball: Ball = {
                x,
                y,
            
                isProjectile: true, 
                owner: socket.id,
                direction,
                startSpeed: BALL.THROW_SPEED
            };

            this.balls.set(id, ball);
            socket.broadcast.emit("createBall", id, ball);
        });

        socket.on("hitByBall", (dispersedBalls) => {
            Object.entries(dispersedBalls).forEach(([id, { x, y, direction, startSpeed }]) => {
                const ball: Ball = {
                    x,
                    y,

                    isProjectile: false,
                    owner: socket.id,
                    direction,
                    startSpeed
                };

                this.balls.set(id, ball);
                socket.broadcast.emit("createBall", id, ball);
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
            collectedBalls: player.collectedBalls?.toString() || "",
            stunned: +player.stunned
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