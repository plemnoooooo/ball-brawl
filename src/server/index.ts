import express from "express";
import ViteExpress from "vite-express";
import { Server as Io } from "socket.io";
import Server from "./Server";

const app = express();
const httpServer = app.listen(3000, "0.0.0.0", () => console.log("listening to http://localhost:3000/"));
ViteExpress.bind(app, httpServer);

const io = new Io(httpServer);
const server = new Server(io);
server.start();