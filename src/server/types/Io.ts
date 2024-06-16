import { Server } from "socket.io";
import { Events } from "../../global/types";

export type Io = Server<Events.Socket, Events.Io>;