import { defineConfig } from "vite";
import socketIoPlugin from "./lib/socketIoPlugin";
import { runServerEvents } from "./src/utils";

export default defineConfig({
    server: { host: "0.0.0.0" },  
    plugins: [socketIoPlugin(runServerEvents)]
});