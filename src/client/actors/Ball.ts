import * as ex from "excalibur";
import { Ball as BallData } from "../../global/types";
import Game from "../Game";
import { Map } from "./Map";

export class Ball extends ex.Actor {
    static readonly TAG_NAME = "ball";
    static readonly DEFAULT_RADIUS = 5;
    static readonly DEFAULT_COLOR = ex.Color.Yellow;

    static readonly THROW_SPEED = 240;
    static readonly SPEED_DECREASE = 0;

    private speed: number;
    
    constructor(private isProjectile: boolean = false, private direction: number = 0, private startSpeed: number = 0) {
        super({
            radius: Ball.DEFAULT_RADIUS,
            collisionType: isProjectile ? ex.CollisionType.Active : ex.CollisionType.Passive
        });

        this.speed = startSpeed;
    }

    onInitialize() {
        this.addTag(Ball.TAG_NAME);
        this.graphics.onPostDraw = (ctx) => ctx.drawCircle(ex.Vector.Zero, Ball.DEFAULT_RADIUS, Ball.DEFAULT_COLOR);

        this.on("collisionstart", ({ other, side }) => {
            if (!other.hasTag(Map.TAG_NAME)) return;
            this.vel.x *= +[ex.Side.Top, ex.Side.Bottom].includes(side) || -1;
            this.vel.y *= +[ex.Side.Left, ex.Side.Right].includes(side) || -1;
            // this.direction = this.vel.toAngle();

            console.log(this.direction);
            // this.direction += Math.PI / 2; //  -this.direction + ((Math.PI / 2) * +[ex.Side.Top, ex.Side.Bottom].includes(side));
        }); 
    }

    update(game: Game, delta: number) {
        super.update(game, delta);

        if (!this.isProjectile) return;
        // this.vel.x = Math.cos(this.direction) * this.speed;
        // this.vel.y = Math.sin(this.direction) * this.speed;
        // = ex.Vector.fromAngle(this.direction).scaleEqual(this.speed);
        Math.abs(this.speed) ? this.vel.subEqual(Ball.SPEED_DECREASE * +((this.speed > 0) || -1)) : this.isProjectile = false;
    }

    set thisProjectile(newThisProjectile: boolean) {
        this.isProjectile = newThisProjectile;
        this.body.collisionType = newThisProjectile ? ex.CollisionType.Active : ex.CollisionType.Passive;
    }

    serialize(): BallData {
        return {
            x: this.pos.x,
            y: this.pos.y,

            isProjectile: this.isProjectile,
            direction: this.direction,
            startSpeed: this.startSpeed
        };
    }

    deserialize({ x, y, isProjectile, direction, startSpeed }: Partial<BallData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);

        if (isProjectile) this.isProjectile = isProjectile;      
        if (direction) this.direction = direction;
        if (isProjectile) this.vel = ex.Vector.One// ex.Vector.fromAngle(direction!).scaleEqual(Ball.THROW_SPEED!);
        if (startSpeed) this.speed = startSpeed;
    }
}