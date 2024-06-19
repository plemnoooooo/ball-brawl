import { Vector } from "../types";
import { isNumberInRange } from ".";

export class Grid<T> {
    constructor(public width: number, public height: number, private tiles: T[][] = []) {
        !tiles.length && this.empty();
    }

    get(x: number, y: number): T {
        [x, y] = this.clampToGrid(x, y);
        return this.tiles[y][x];
    }

    getRow(y: number): T[] {
        y = this.clampToGrid(0, y)[1];
        return this.tiles[y];
    }

    getColumn(x: number): T[] {
        x = this.clampToGrid(x, 0)[0];
        return this.reduce((a, v, i) => {
            (i === x) && a.push(v);
            return a;
        }, [] as T[]);
    }

    getSection(x: number, y: number, width: number, height: number): Grid<T> {
        if (((x + width) < 0) || ((y + height) < 0)) return Grid.fromTiles([]);
        const [cx, cy] = this.clampToGrid(x, y);
        
        const section = new Grid<T>(Math.min(width, (x >= 0) ? this.width - cx : Math.abs(x + width)), Math.min(height, (y >= 0) ? this.height - cy : Math.abs(y + height)));
        for (let i = 0; i < section.height; i++) {
            for (let j = 0; j < section.width; j++) {
                section.set(this.get(cx + j, cy + i), j, i);
            }
        }

        return section;
    }

    getAdjacentTiles(x: number, y: number): T[] {
        const result: T[] = [];
        if (!isNumberInRange(x, 0, this.width - 1) || !isNumberInRange(y, 0, this.height - 1)) return result;
        
        const section = this.getSection(x - 1, y - 1, 3, 3);
        
        x && result.push(section.get(0, (section.height === 3) ? 1 : +!!y));
        (x < (this.width - 1)) && result.push(section.get(2, (section.height === 3) ? 1 : +!!y));
        y && result.push(section.get((section.width === 3) ? 1 : +!!x, 0));
        (y < (this.height - 1)) && result.push(section.get((section.width === 3) ? 1 : +!!(x > 0), 2));

        return result;
    }

    set(tile: T, x: number, y: number) {
        [x, y] = this.clampToGrid(x, y);
        this.tiles[y][x] = tile;
    }

    empty(width?: number, height?: number) {
        if (width) this.width = width;
        if (height) this.height = height;
        
        this.tiles = Array(this.height).fill(null).map(() => Array(this.width).fill(null));
    }

    forEach<U>(xCallback: (v: T, x: number, y: number, data?: U) => void, yCallback?: (v: T[], y: number) => U | undefined) {
        this.tiles.forEach((v, y) => {
            const data = yCallback && yCallback(v, y);
            v.forEach((v, x) => xCallback(v, x, y, data));
        });
    }

    reduce(callback: (previous: T, current: T, x: number, y: number, a: T[]) => any): T;
    reduce<NewT>(callback: (previous: NewT, current: T, x: number, y: number, a: T[]) => NewT, initial: NewT): NewT;
    reduce<NewT>(callback: (previous: T | NewT, current: T | NewT, x: number, y: number, a: T[]) => T | NewT, initial?: T | NewT): T | NewT {
        let result: T | NewT = (initial === undefined) ? this.get(0, 0) : initial;

        this.forEach((v, x, y) => {
            if ((initial === undefined) && [x, y].every((v) => !v)) {
                result = this.get(0, 0);
                return;
            }

            result = callback(result, v, x, y, this.tiles[y]);
        });

        return result;
    }

    clone(): Grid<T> {
        return Grid.fromTiles(this.raw());
    }

    raw(flat?: false): T[][];
    raw(flat?: true): T[];
    raw(flat: boolean = false) {
        return flat ? this.tiles.flat() : this.tiles;
    }

    private clampToGrid(x: number, y: number): Vector {
        return [Math.floor(isNumberInRange(x, 0, this.width - 1, true)), Math.floor(isNumberInRange(y, 0, this.height - 1, true))];
    }

    static fromTiles<T>(tiles: T[][]) {
        return new Grid(tiles[0]?.length, tiles.length, tiles);
    }
}