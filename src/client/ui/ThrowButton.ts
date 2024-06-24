import * as ex from "excalibur";
import Game from "../Game";

export class ThrowButton extends ex.ScreenElement {
    static readonly RADIUS = 40;
    static readonly COLOR = ex.Color.Gray;
    static readonly BOTTOM_MARGIN = 80;
    static readonly OPACITY = 0.72;

    constructor() {
        super({
            z: 999,
            anchor: ex.Vector.Half,
            radius: ThrowButton.RADIUS,
            color: ThrowButton.COLOR,
            opacity: ThrowButton.OPACITY
        });
    }

    onInitialize(game: Game) {
        this.pos.setTo(game.halfDrawWidth, game.drawHeight - ThrowButton.BOTTOM_MARGIN);
        game.screen.events.on(ex.ScreenEvents.ScreenResize, ({ resolution: { width, height } }) => this.pos.setTo(width / 2, height - ThrowButton.BOTTOM_MARGIN));
    }
}