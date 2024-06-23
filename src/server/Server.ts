import { Random } from "../global/utils";
import { Io, Room as RoomData } from "./types";
import Room from "./Room";
import { MAP } from "../global/constants";

export default class Server {
    static readonly MAX_ROOM_SOCKETS = 8;
    private rooms: Map<string, Room>;

    constructor(public io: Io) {
        this.rooms = new Map();
    }

    start() {
        this.io.on("connect", (socket) => {
            let [id, room] = Random.select(Array.from(this.rooms.entries()).filter(([_, { sockets, maxSockets }]) => sockets.size < maxSockets));

            if (!id) {
                id = Random.generateBase64();
                this.createRoom(id, {
                    maxSockets: Server.MAX_ROOM_SOCKETS,
                    mapWidth: MAP.WIDTH,
                    mapHeight: MAP.HEIGHT
                });

                room = this.rooms.get(id)!;
                room.start();
            }

            room.addSocket(socket);
            console.log(`socket ${socket.id} has connected to room ${id}.`);     

            socket.on("disconnect", () => {
                room.removeSocket(socket.id);
                console.log(`socket ${socket.id} has disconneted from room ${id}.`);

                if (room.sockets.size > 0) return;
                this.deleteRoom(id);
            });
        });
    }

    private createRoom(id: string, { maxSockets, mapWidth, mapHeight, createBallRate, maxBalls }: RoomData) {
        const room = new Room(id, maxSockets, mapWidth, mapHeight, createBallRate, maxBalls);
        this.rooms.set(id, room);

        console.log(`room ${id} has been created.`);
    }

    private deleteRoom(id: string) {
        const room = this.rooms.get(id);
        if (!room) return;

        room.sockets.forEach((_, id) => room.removeSocket(id));
        this.rooms.delete(id);

        console.log(`room ${id} has been deleted.`);
    }
}