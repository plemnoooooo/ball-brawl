import { Server as HttpServer } from "http";
import { PluginOption } from "vite";
import { Server } from "socket.io";

export default function socketIoPlugin(runServerEvents: (io: Server) => void): PluginOption {
    return {
        name: "socket.io",
        configureServer({ httpServer }) {
            const io = new Server(httpServer as HttpServer);
            
            runServerEvents(io);
        }
    }
}