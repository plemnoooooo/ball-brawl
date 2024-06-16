import { Socket as BaseSocket } from "socket.io-client";
import { Events } from "../../global/types";

export type Socket = BaseSocket<Events.Io, Events.Socket>;