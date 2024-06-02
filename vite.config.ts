import { defineConfig } from "vite";
import socketIoPlugin from "./lib/socketIoPlugin";
import { runServerEvents } from "./src/utils";

export default defineConfig({
    plugins: [socketIoPlugin(runServerEvents)]
});