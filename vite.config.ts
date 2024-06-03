import { defineConfig } from "vite";
import socketIoPlugin from "./lib/socketIoPlugin";
import { runServerEvents } from "./src/utils";

export default defineConfig({
    server: {
        host: "0.0.0.0",
        proxy: {
            "/socket.io/": {
                target: "http://localhost:5002",
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        }
    },  
    plugins: [socketIoPlugin(runServerEvents)]
});