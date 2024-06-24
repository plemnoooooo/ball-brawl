import * as ex from "excalibur";
import Game from "../Game";

export class BallCounter extends ex.ScreenElement {
    static readonly FONT_SIZE = 24;
    static readonly TEXT_COLOR = ex.Color.White;
    static readonly BACKGROUND_COLOR = ex.Color.Black;

    static readonly TOP_MARGIN = 48;
    static readonly PADDING_X = 8;
    static readonly PADDING_Y = 2;

    private text: ex.Text;
    private background: ex.Rectangle;

    constructor(public count: number = 0) {
        super({ z: 999 });

        this.text = new ex.Text({
            text: `${count}`,
            font: new ex.Font({
                color: BallCounter.TEXT_COLOR,
                size: BallCounter.FONT_SIZE,
                baseAlign: ex.BaseAlign.Top,
                textAlign: ex.TextAlign.Center
            })
        });

        this.background = new ex.Rectangle({
            width: this.text.width + (2 * BallCounter.PADDING_X),
            height: BallCounter.FONT_SIZE + (2 * BallCounter.PADDING_Y),
            color: BallCounter.BACKGROUND_COLOR,
            smoothing: true
        });
    }

    onInitialize(game: Game) {
        this.pos.setTo(game.halfDrawWidth, BallCounter.TOP_MARGIN);
        game.screen.events.on(ex.ScreenEvents.ScreenResize, ({ resolution: { width } }) => this.pos.setTo(width / 2, BallCounter.TOP_MARGIN));

        this.graphics.onPostDraw = (ctx) => {
            this.background.width = this.text.width + (2 * BallCounter.PADDING_X);
            this.background.draw(ctx, -this.background.width / 2, BallCounter.PADDING_Y);

            this.text.text = `${this.count}`;
            this.text.draw(ctx, 0, 0);
        }
    }
}