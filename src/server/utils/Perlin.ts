import { Vector } from "../../global/types";
import { Grid, Random } from "../../global/utils";

// perlin noise generator from https://github.com/joeiddon/perlin
export class Perlin {
    tiles: Grid<number>;
    private gradients: Grid<Vector>;

    constructor(public width: number, public height: number, public magnitude: Vector = [10, 10]) {
        this.tiles = new Grid(width, height);
        this.gradients = new Grid(width, height);

        this.regenerate();
    }

    regenerate(width?: number, height?: number) {
        if (width) this.width = width;
        if (height) this.height = height;

        this.tiles.empty(this.width, this.height);
        this.gradients.empty(this.width, this.height);

        this.tiles.forEach((_, x, y) => {
            x /= this.width;
            y /= this.height;

            const fx = Math.floor(x);
            const fy = Math.floor(x);

            const tl = this.dotProductGrid([x, y], [fx, fy]);
            const tr = this.dotProductGrid([x, y], [fx + 1, fy]);
            const bl = this.dotProductGrid([x, y], [fx, fy + 1]);
            const br = this.dotProductGrid([x, y], [fx + 1, fy + 1]);
            
            const xt = Perlin.interpolate(x - fx, tl, tr);
            const xb = Perlin.interpolate(x - fx, bl, br);

            const v = Perlin.interpolate(y - fy, xt, xb);
            
            this.tiles.set(v, x * this.width, y * this.height);
        });
    }

    private static getRandomVector(): Vector {
        const theta = Random.number(2 * Math.PI, 0, false);

        return [Math.cos(theta), Math.sin(theta)]
    }

    private dotProductGrid([x, y]: Vector, [vx, vy]: Vector) {
        const dx = x - vx;
        const dy = y - vy;
        const [mx, my] = this.magnitude;

        if (this.gradients.get(vx, vy) === null) this.gradients.set(Perlin.getRandomVector(), vx, vy);
        const [gx, gy] = this.gradients.get(vx, vy);

        return (dx * gx * mx) + (dy * gy * my);
    }

    private static interpolate(x: number, a: number, b: number) {
        return a + (((6 * (x ** 5)) - (15 * (x ** 4)) + (10 * (x ** 3))) * (b - a));
    }
}