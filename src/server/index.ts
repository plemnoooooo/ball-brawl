import express from "express";
import ViteExpress from "vite-express";
import { Server } from "socket.io";
import { runServerEvents } from "../client/utils";

const app = express();
const server = app.listen(3000, "0.0.0.0", () => console.log("listening to http://localhost:3000/"));
const io = new Server(server);

ViteExpress.bind(app, server);

io.on("connect", (socket) => {
    console.log(`socket ${socket.id} has connected.`);
    socket.on("disconnect", () => console.log(`socket ${socket.id} has disconnected.`));
});

runServerEvents(io);