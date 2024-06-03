import * as ex from "excalibur";
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";
import { SCENES, SERVER } from "./constants";
import { Socket } from "./types";
import { Play }from "./scenes";

export default class Game extends ex.Engine {
    SI: SnapshotInterpolation;

    constructor(public socket: Socket) {
        super({ displayMode: ex.DisplayMode.FillScreen });

        this.SI = new SnapshotInterpolation(SERVER.FRAME_RATE);
    }

    start() {
        this.add(SCENES.PLAY, new Play());
        return super.start().then(() => this.goToScene(SCENES.PLAY));
    }
}