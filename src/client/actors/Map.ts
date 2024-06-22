import * as ex from "excalibur";
import { TILE } from "../../global/constants";
import { Grid, findAverage, isNumberInRange } from "../../global/utils";
import { Tile } from "../types";

export class Map extends ex.Actor {
    static readonly TAG_NAME = "map";
    static readonly TILE_COLOR = ex.Color.White;
    
    static readonly BORDER_WIDTH = 100;
    static readonly BORDER_HEIGHT = 100;
    static readonly COLLIDER_THICKNESS = 0.01;

    public mapWidth: number;
    public mapHeight: number;
    public pixelWidth: number;
    public pixelHeight: number;

    private renderQueue: Tile[];
    private averageTileWeight: number;

    constructor(public tiles: Grid<number>) {
        super({
            z: -999,
            scale: ex.vec(TILE.WIDTH, TILE.HEIGHT),
            anchor: ex.Vector.Zero,
            collisionType: ex.CollisionType.Fixed
        });

        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height;
        this.pixelWidth = (this.mapWidth + (2 * Map.BORDER_WIDTH)) * TILE.WIDTH;
        this.pixelHeight = (this.mapHeight + (2 * Map.BORDER_HEIGHT)) * TILE.HEIGHT;

        this.renderQueue = [];
        this.averageTileWeight = findAverage(tiles.raw(true));
    }

    onInitialize() {
        this.addTag(Map.TAG_NAME);
        this.reload();

        this.graphics.onPostDraw = (ctx) => {
            for (const { x, y, width, height } of this.renderQueue) {
                ctx.drawRectangle(ex.vec(x, y), width + (1 / TILE.WIDTH), height + (1 / TILE.HEIGHT), Map.TILE_COLOR);
            }
        }
    }

    setMap(tiles: Grid<number>) {
        this.tiles = tiles;

        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height;
        this.pixelWidth = (this.mapWidth + (2 * Map.BORDER_WIDTH)) * TILE.WIDTH;
        this.pixelHeight = (this.mapHeight + (2 * Map.BORDER_HEIGHT)) * TILE.HEIGHT;
        
        this.averageTileWeight = findAverage(tiles.raw(true));

        this.reload();
    }

    reload(createBorders: boolean = true) {
        this.graphics.use(new ex.Rectangle({
            width: this.mapWidth,
            height: this.mapHeight,
            color: ex.Color.Transparent
        }));
        
        this.renderQueue = [];
        const colliders: Tile[] = [];

        this.tiles.forEach((v, x, y, joinTile) => {
            joinTile = this.isNumberInTileRange(v);
            if (joinTile) return;

            this.isNumberInTileRange(this.tiles.get(x - 1, y)) && this.renderQueue.push({
                x,
                y,
                width: 0,
                height: 1,
                ax: 0,
                ay: 0
            });
            
            this.renderQueue.slice(-1)[0].width++;

            const { up, down, left, right } = this.tiles.getAdjacentTiles(x, y);
            if ((up !== undefined) && this.isNumberInTileRange(up)) {
                const collider = colliders.find(({
                    x: cx,
                    y: cy,
                    width,
                    ay
                }) => (cx === (x - width)) && (cy === y) && !ay);

                collider ? collider.width++ : colliders.push({
                    x,
                    y,
                    width: 1,
                    height: Map.COLLIDER_THICKNESS,
                    ax: 0,
                    ay: 0
                });
            }

            if ((down !== undefined) && this.isNumberInTileRange(down)) {
                const collider = colliders.find(({
                    x: cx,
                    y: cy,
                    width,
                    ay
                }) => (cx === (x - width)) && (cy === y) && ay);

                collider ? collider.width++ : colliders.push({
                    x,
                    y,
                    width: 1,
                    height: Map.COLLIDER_THICKNESS,
                    ax: 0,
                    ay: 1
                });
            }

            if ((left !== undefined) && this.isNumberInTileRange(left)) {
                const collider = colliders.find(({
                    x: cx,
                    y: cy,
                    height,
                    ax
                }) => (cx === x) && (cy === (y - height)) && !ax);

                collider ? collider.height++ : colliders.push({
                    x,
                    y,
                    width: Map.COLLIDER_THICKNESS,
                    height: 1,
                    ax: 0,
                    ay: 0
                });
            }

            if ((right !== undefined) && this.isNumberInTileRange(right)) {
                const collider = colliders.find(({
                    x: cx,
                    y: cy,
                    height,
                    ax
                }) => (cx === x) && (cy === (y - height)) && ax);

                collider ? collider.height++ : colliders.push({
                    x,
                    y,
                    width: Map.COLLIDER_THICKNESS,
                    height: 1,
                    ax: 1,
                    ay: 0
                });
            }
        }, (a, y) => {
            this.renderQueue.push({
                x: a.findIndex((v) => !this.isNumberInTileRange(v)),
                y,
                width: 0,
                height: 1,
                ax: 0,
                ay: 0
            });

            return false;
        });

        if (createBorders) {
            const borders: Tile[] = [{
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT,
                ax: 0,
                ay: 0
            }, {
                x: -Map.BORDER_WIDTH,
                y: this.mapHeight,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT,
                ax: 0,
                ay: 0
            }, {
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT),
                ax: 0,
                ay: 0
            }, {
                x: this.mapWidth,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT),
                ax: 0,
                ay: 0
            }];

            this.renderQueue.push(...borders);
            colliders.push(...borders);
        }  

        this.collider.useCompositeCollider(colliders.map(({ x, y, width, height, ax, ay }) => ex.Shape.Box(width, height, ex.Vector.Zero, ex.vec(x + ax - (Map.COLLIDER_THICKNESS * +!!ax), y + ay - (Map.COLLIDER_THICKNESS * +!!ay)))));
    }

    isNumberInTileRange(v: number) {
        return isNumberInRange(v, this.averageTileWeight - TILE.OFFSET.MIN, this.averageTileWeight + TILE.OFFSET.MAX);
    }
}