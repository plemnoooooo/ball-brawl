import { Socket as BaseSocket } from "socket.io";
import { Events } from "../../global/types";

export type Socket = BaseSocket<Events.Socket, Events.Io>;