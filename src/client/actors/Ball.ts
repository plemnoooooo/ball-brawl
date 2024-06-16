import * as ex from "excalibur";
import { Ball as BallData } from "../../global/types";
import Game from "../Game";

export class Ball extends ex.Actor {
    static readonly TAG_NAME = "ball";
    static readonly DEFAULT_RADIUS = 5;
    static readonly DEFAULT_COLOR = ex.Color.Yellow;
    static readonly SPEED_DECREASE = 0.02;

    private speed: number;
    
    constructor(private isProjectile: boolean = false, private direction: number = 0, private startSpeed: number = 0, private hidden: boolean = false) {
        super({
            radius: Ball.DEFAULT_RADIUS,
            collisionType: hidden ? ex.CollisionType.PreventCollision : ex.CollisionType.Active
        });

        this.speed = startSpeed;
    }

    onInitialize() {
        this.addTag(Ball.TAG_NAME);
        this.graphics.onPostDraw = (ctx) => !this.hidden && ctx.drawCircle(ex.Vector.Zero, Ball.DEFAULT_RADIUS, Ball.DEFAULT_COLOR);
    }

    update(game: Game, delta: number) {
        super.update(game, delta);

        if (!this.isProjectile) return;
        this.vel = ex.Vector.fromAngle(this.direction).scaleEqual(this.speed);
        if (Math.abs(this.speed)) this.speed -= Ball.SPEED_DECREASE * +((this.speed > 0) || -1);
    }

    serialize(): BallData {
        return {
            x: this.pos.x,
            y: this.pos.y,

            hidden: this.hidden,
            isProjectile: this.isProjectile,

            direction: this.direction,
            startSpeed: this.startSpeed
        };
    }

    deserialize({ x, y, hidden, isProjectile, direction, startSpeed }: Partial<BallData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);
    
        if (hidden !== undefined) this.hidden = hidden;
        if (isProjectile) this.isProjectile = isProjectile;
        
        if (direction) this.direction = direction;
        if (startSpeed) this.speed = startSpeed;
    }

    collect() {
        this.hidden = true;
        this.body.collisionType = ex.CollisionType.PreventCollision;
    }
}