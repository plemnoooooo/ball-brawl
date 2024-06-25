import io from "socket.io-client";
// import eruda from "eruda";
import "./style.css";
import Game from "./Game";

// eruda.init();

window.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    
    socket.on("connect", () => {
        console.log("connected to server.");

        const game = new Game(socket);
        game.start();
    });
});
