import * as ex from "excalibur";
import { SnapshotInterpolation } from "@geckos.io/snapshot-interpolation";

import { SERVER } from "../global/constants";
import { SCENES } from "./constants";
import { Socket } from "./types";
import { Play } from "./scenes";

export default class Game extends ex.Engine {
    static readonly BACKGROUND_COLOR = ex.Color.Black;
    SI: SnapshotInterpolation;

    constructor(public socket: Socket) {
        super({
            displayMode: ex.DisplayMode.FillScreen,
            backgroundColor: Game.BACKGROUND_COLOR
        });
        
        this.SI = new SnapshotInterpolation(SERVER.IO_EMIT_RATE);
    }

    start() {
        this.add(SCENES.PLAY, new Play());
        return super.start().then(() => this.goToScene(SCENES.PLAY));
    }
}