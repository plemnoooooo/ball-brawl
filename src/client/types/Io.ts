import { Server } from "socket.io";
import { Events } from ".";

export type Io = Server<Events.Socket, Events.Io>;