import io from "socket.io-client";
import eruda from "eruda";
import "./style.css";

import { SERVER } from "./constants";
import Game from "./Game";

eruda.init();

window.addEventListener("DOMContentLoaded", () => {
    const socket = io(); // io(import.meta.env.DEV ? "": SERVER.URL);

    socket.on("connect", () => {
        console.log("connected to server.");

        const game = new Game(socket);
        game.start();
    });

    socket.on("connect_error", (error) => console.error(error.name, error.message));
});