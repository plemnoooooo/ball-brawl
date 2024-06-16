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
        const [cx, cy] = this.clampToGrid(x, y);
        
        const section = new Grid<T>(width - Math.abs(x - cx), height - Math.abs(cy - y));
        for (let i = 0; i < section.height; i++) {
            for (let j = 0; j < section.width; j++) {
                section.set(this.get(cx + j, cy + i), j, i);
            }
        }

        return section;
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