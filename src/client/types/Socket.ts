import { Socket as BaseSocket } from "socket.io-client";
import { Events } from ".";

export type Socket = BaseSocket<Events.Io, Events.Socket>;