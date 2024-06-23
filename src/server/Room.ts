 import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { State } from "@geckos.io/snapshot-interpolation/lib/types";

import { BALL, MAP, SERVER, TILE } from "../global/constants";
import { Ball, Events, Player, Vector } from "../global/types";
import { Random, findAverage, isNumberInRange } from "../global/utils";

import { Socket } from "./types";
import { Perlin } from "./utils";

export default class Room {
    static readonly DEFAULT_CREATE_BALL_RATE = 8;
    static readonly DEFAULT_MAX_BALLS = 80;

    private SI: SnapshotInterpolation;
    sockets: Map<string, Socket>;
    private tick: number;
    
    players: Map<string, Player>;
    balls: Map<string, Ball>;
    map: Perlin;

    constructor(public id: string, public maxSockets: number, mapWidth: number, mapHeight: number, private createBallRate: number = Room.DEFAULT_CREATE_BALL_RATE, private maxBalls: number = Room.DEFAULT_MAX_BALLS) {
        this.SI = new SnapshotInterpolation(SERVER.IO_EMIT_RATE);
        this.sockets = new Map();

        this.players = new Map();
        this.balls = new Map();
        this.map = new Perlin(mapWidth, mapHeight);
        this.tick = 0;
    }

    start() {
        setInterval(this.update.bind(this), 1000 / SERVER.TICK_RATE);
    }

    update() {
        this.tick++;

        if (!(this.tick % this.createBallRate) && (this.balls.size <= this.maxBalls)) {
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
            this.emitToAll("createBall", id, ball);
        }

        const worldState = this.getWorldState();

        const snapshot = this.SI.snapshot.create(worldState);
        this.SI.vault.add(snapshot);

        !(this.tick % (SERVER.TICK_RATE / SERVER.IO_EMIT_RATE)) && this.emitToAll("update", snapshot);
    }

    emitToAll<T extends keyof Events.Io>(event: T, ...data: Parameters<Events.Io[T]>) {
        this.sockets.forEach((socket) => socket.emit(event, ...data));
    }

    addSocket(socket: Socket) {
        if (this.sockets.size >= this.maxSockets) return;

        let player: Player;

        socket.join(this.id);
        this.sockets.set(socket.id, socket);
        
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
            socket.to(this.id).except(socket.id).emit("createPlayer", socket.id, player);
        });

        socket.on("updatePlayer", (playerData) => this.players.set(socket.id, { ...player, ...playerData }));
        socket.on("updateBall", (id, ball) => this.balls.set(id, { ...this.balls.get(id)!, ...ball }));

        socket.on("collectBall", (id) => {
            this.balls.delete(id);
            socket.to(this.id).except(socket.id).emit("deleteBall", id);
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
            socket.to(this.id).except(socket.id).emit("createBall", id, ball);
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
                socket.to(this.id).except(socket.id).emit("createBall", id, ball);
            });
        });
    }

    removeSocket(id: string) {
        const socket = this.sockets.get(id);
        if (!socket) return;

        socket.to(this.id).except(id).emit("deletePlayer", id);
        socket.offAny();

        this.players.delete(id);
        this.sockets.delete(id);

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

    private getRandomVector(preventCollision: boolean = true): Vector {
        let vector = Random.vector([MAP.WIDTH * TILE.WIDTH, MAP.HEIGHT * TILE.HEIGHT]);
        if (!preventCollision) return vector;

        const averageTileWeight = findAverage(this.map.tiles.raw(true));
        while (!isNumberInRange(this.map.tiles.get(vector[0] / TILE.WIDTH, vector[1] / TILE.HEIGHT), averageTileWeight - TILE.OFFSET.MIN, averageTileWeight + TILE.OFFSET.MAX)) {
            vector = Random.vector([MAP.WIDTH * TILE.WIDTH, MAP.HEIGHT * TILE.HEIGHT]);
        }

        return vector;
    }
}