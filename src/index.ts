import io from "socket.io-client";
import eruda from "eruda";
import "./style.css";
import Game from "./Game";

eruda.init();

const socket = io();
window.addEventListener("DOMContentLoaded", () => {
    const game = new Game(socket);
    game.start();
});

// import io from "socket.io-client";
// import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
// import eruda from "eruda";
// import "./style.css";

// import { SERVER } from "./constants";
// import { Player, Socket } from "./types";
// import Game from "./Game";

// eruda.init();

// const socket = io();
// window.addEventListener("DOMContentLoaded", () => {
//     const game = new Game(socket);
//     game.start();
// });

// const SI = new SnapshotInterpolation(SERVER.FRAME_RATE);
// const players: Map<string, Player> = new Map();
// let playerUpdate: Partial<Player> = {};

// const hs: Socket = io();
// socket.on("connect", () => {
//     console.log("connected to server");

//     socket.emitWithAck("setupPlayer", window.innerWidth, window.innerHeight).then((player) => {
//         players.set(socket.id!, player);
//         addPlayer(socket.id!, player);
//     });

//     socket.emitWithAck("retrievePlayers").then((otherPlayers) => new Map(Object.entries(otherPlayers)).forEach((player, id) => {
//         if (id === socket.id) return;
//         players.set(id, player);
//         addPlayer(id, player);
//     }));

//     update();
// });

// socket.on("createPlayer", (id, player) => {
//     players.set(id, player);
//     addPlayer(id, player);
// });

// socket.on("deletePlayer", (id) => {
//     players.delete(id);
//     removePlayer(id);
// });

// socket.on("updatePlayers", (snapshot) => SI.snapshot.add(snapshot));

// function update() {
//     requestAnimationFrame(update);

//     const snapshot = SI.calcInterpolation("x y");
//     if (!snapshot) return;
    
//     for (let { id, x, y } of snapshot.state) {
//         const player = {
//             x: x as number,
//             y: y as number
//         };

//         if (id === socket.id) continue;

//         players.set(id, player);
//         updatePlayer(id, player);
//     }

//     socket.emit("updatePlayer", playerUpdate);
//     playerUpdate = {};
// }

// document.addEventListener("pointermove", ({ clientX, clientY }) => {
//     playerUpdate = {
//         ...playerUpdate,
//         x: clientX,
//         y: clientY
//     };

//     updatePlayer(socket.id!, playerUpdate);
// });

// function addPlayer(id: string, playerData: Player) {
//     const player = document.createElement("div");
//     document.body.appendChild(player);

//     player.id = id;
//     player.className = "player";

//     updatePlayer(id, playerData);
// }

// function updatePlayer(id: string, { x, y }: Partial<Player>) {
//     const player = document.getElementById(id)!;
//     player.style.left = `${x}px`;
//     player.style.top = `${y}px`;
// }

// function removePlayer(id: string) {
//     const player = document.getElementById(id)!;
//     document.body.removeChild(player);
// }