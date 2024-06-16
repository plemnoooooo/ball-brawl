import * as ex from "excalibur";
import { Player as PlayerData } from "../../global/types";

export class Player extends ex.Actor {
    static readonly TAG_NAME = "player";
    static readonly DEFAULT_RADIUS = 10;
    static readonly DEFAULT_COLOR = ex.Color.Red;
    static readonly DEFAULT_USERNAME = "Player";

    static readonly MAX_SPEED = 6;
    
    collectedBalls: string[];
    thrownBalls: string[];

    constructor(public username: string = Player.DEFAULT_USERNAME) {
        super({
            radius: Player.DEFAULT_RADIUS,
            color: Player.DEFAULT_COLOR,
            collisionType: ex.CollisionType.Active
        });

        this.collectedBalls = [];
        this.thrownBalls = [];
    }

    onInitialize() {
        this.addTag(Player.TAG_NAME);
    }

    serialize(): PlayerData {
        return {
            x: this.pos.x,
            y: this.pos.y,
            username: this.username,

            collectedBalls: this.collectedBalls,
            thrownBalls: this.thrownBalls
        };
    }

    deserialize({ x, y, username, collectedBalls, thrownBalls }: Partial<PlayerData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);
        
        if (username) this.username = username;
        if (collectedBalls !== undefined) this.collectedBalls = collectedBalls;
        if (thrownBalls !== undefined) this.thrownBalls = thrownBalls;
    }
}