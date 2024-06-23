import * as ex from "excalibur";
import { Player as PlayerData } from "../../global/types";
import Game from "../Game";

export class Player extends ex.Actor {
    static readonly TAG_NAME = "player";
    static readonly DEFAULT_RADIUS = 10;
    static readonly DEFAULT_COLOR = ex.Color.Red;

    static readonly DEFAULT_USERNAME = "Player";
    static readonly USERNAME_COLOR = ex.Color.White;

    static readonly MOVE_SPEED = 240;
    static readonly STUNNED_DURATION = 3000;
    static readonly STUNNED_BLINKING_TICKS = 12;
    
    collectedBalls: string[];
    stunned: boolean;
    private tick: number;

    constructor(public username: string = Player.DEFAULT_USERNAME) {
        super({
            radius: Player.DEFAULT_RADIUS,
            color: Player.DEFAULT_COLOR,
            collisionType: ex.CollisionType.Active
        });

        this.collectedBalls = [];
        this.stunned = false;
        this.tick = 0;
    }

    onInitialize() {
        this.addTag(Player.TAG_NAME);
        
        const username = new ex.Label({
            y: -30,
            text: this.username,
            color: Player.USERNAME_COLOR,
            font: new ex.Font({ textAlign: ex.TextAlign.Center })
        });

        this.addChild(username);
    }

    update(game: Game, delta: number) {
        this.tick++;
        this.color = ((Math.floor(this.tick / Player.STUNNED_BLINKING_TICKS) % 2) && this.stunned) ? ex.Color.Transparent : Player.DEFAULT_COLOR;

        super.update(game, delta);
    }

    serialize(): PlayerData {
        return {
            x: this.pos.x,
            y: this.pos.y,
            username: this.username,
            collectedBalls: this.collectedBalls,
            stunned: this.stunned
        };
    }

    deserialize({ x, y, username, collectedBalls, stunned }: Partial<PlayerData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);
        
        if (username) this.username = username;
        if (collectedBalls !== undefined) this.collectedBalls = collectedBalls;
        if (stunned !== undefined) this.stunned = stunned;
    }
}