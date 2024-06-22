import * as ex from "excalibur";
import { Ball as BallData } from "../../global/types";
import Game from "../Game";
import { Map } from "./Map";

export class Ball extends ex.Actor {
    static readonly TAG_NAME = "ball";
    static readonly DEFAULT_RADIUS = 8;
    static readonly DEFAULT_COLOR = ex.Color.Yellow;

    static readonly SPEED_DECREASE = 0.4;
    static readonly MIN_PROJECTILE_SPEED = 120;

    static readonly DISPERSE_AMOUNT_MIN = 3;
    static readonly DISPERSE_AMOUNT_MAX = 8;
    static readonly DISPERSE_SPEED_MIN = 40;
    static readonly DISPERSE_SPEED_MAX = 80;

    speed: number;
    
    constructor(public isProjectile: boolean = false, public owner: string, private direction: number = 0, private startSpeed: number = 0) {
        super({
            radius: Ball.DEFAULT_RADIUS,
            collisionType: ex.CollisionType.Passive
        });

        this.speed = startSpeed;
    }

    onInitialize() {
        this.addTag(Ball.TAG_NAME);
        this.graphics.onPostDraw = (ctx) => ctx.drawCircle(ex.Vector.Zero, Ball.DEFAULT_RADIUS, Ball.DEFAULT_COLOR);

        this.on("collisionstart", ({ other, side }) => {
            if (!other.hasTag(Map.TAG_NAME)) return;
            this.direction += [ex.Side.Left, ex.Side.Right].includes(side) ? Math.PI - (((this.direction) % Math.PI) * 2) : -this.direction * 2;
        }); 
    }

    update(game: Game, delta: number) {
        super.update(game, delta);

        this.vel = ex.Vector.fromAngle(this.direction).scaleEqual(this.speed);
        (this.speed > 0) ? this.speed -= Ball.SPEED_DECREASE : this.speed = 0;

        if (this.speed > Ball.MIN_PROJECTILE_SPEED) return;
        this.isProjectile = false;
    }

    serialize(): BallData {
        return {
            x: this.pos.x,
            y: this.pos.y,

            isProjectile: this.isProjectile,
            owner: this.owner,
            direction: this.direction,
            startSpeed: this.startSpeed
        };
    }

    deserialize({ x, y, isProjectile, owner, direction, startSpeed }: Partial<BallData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);

        if (isProjectile) this.isProjectile = isProjectile;      
        if (owner) this.owner = owner;
        if (direction) this.direction = direction;
        if (startSpeed) this.speed = startSpeed;
    }
}