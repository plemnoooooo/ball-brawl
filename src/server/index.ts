import express from "express";
import ViteExpress from "vite-express";
import { Server as Io } from "socket.io";
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";

import { SERVER } from "../global/constants";
import Server from "./Server";

const app = express();
const httpServer = app.listen(3000, "0.0.0.0", () => console.log("listening to http://localhost:3000/"));
ViteExpress.bind(app, httpServer);

const io = new Io(httpServer);
const SI = new SnapshotInterpolation(SERVER.IO_EMIT_RATE);
const server = new Server(io, SI);
server.start();

io.on("connect", (socket) => {
    console.log(`socket ${socket.id} has connected.`);
    socket.on("disconnect", () => console.log(`socket ${socket.id} has disconnected.`));
});