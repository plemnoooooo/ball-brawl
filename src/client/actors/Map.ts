import * as ex from "excalibur";
import { TILE } from "../../global/constants";
import { Vector } from "../../global/types";
import { Grid, findAverage, isNumberInRange } from "../../global/utils";
import { Tile } from "../types";

export class Map extends ex.Actor {
    static readonly TAG_NAME = "map";
    static readonly TILE_COLOR = ex.Color.White;
    
    static readonly BORDER_WIDTH = 100;
    static readonly BORDER_HEIGHT = 100;

    public mapWidth: number;
    public mapHeight: number;

    private renderQueue: Tile[];
    private averageTileWeight: number;

    constructor(public tiles: Grid<number>) {
        super({
            scale: ex.vec(TILE.WIDTH, TILE.HEIGHT),
            anchor: ex.Vector.Zero,
            collisionType: ex.CollisionType.Fixed
        });

        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height;

        this.renderQueue = [];
        this.averageTileWeight = findAverage(tiles.raw(true));
    }

    onInitialize() {
        this.addTag(Map.TAG_NAME);
        this.reload();

        this.graphics.onPostDraw = (ctx) => {
            for (const { x, y, width, height } of this.renderQueue) {
                ctx.drawRectangle(ex.vec(x, y), width, height + (1 / TILE.HEIGHT), Map.TILE_COLOR);
            }
        }
    }

    setMap(tiles: Grid<number>) {
        this.tiles = tiles;
        this.mapWidth = tiles.width;
        this.mapHeight = tiles.height; 
        
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
        const horizontalColliders: Tile[] = [];
        const verticalColliders: Tile[] = [];

        this.tiles.forEach((v, x, y, joinTile) => {
            joinTile = this.isNumberInTileRange(v);
            if (joinTile) return;

            this.isNumberInTileRange(this.tiles.get(x - 1, y)) && this.renderQueue.push({
                x,
                y,
                width: 0,
                height: 1
            });
            
            this.renderQueue.slice(-1)[0].width++;

            if (!this.tiles.getSection(x - 1, y - 1, 3, 3).reduce((result, tile) => result || this.isNumberInTileRange(tile), false)) return;
                const collider = horizontalColliders.find(({
                    x: cx,
                    y: cy,
                    width
                }) => (cx === (x - width) && (cy === y)));
                
                collider ? collider.width++ : horizontalColliders.push({
                    x,
                    y,
                    width: 1,
                    height: 1
                });
        }, (a, y) => {
            this.renderQueue.push({
                x: a.findIndex((v) => !this.isNumberInTileRange(v)),
                y,
                width: 0,
                height: 1
            });

            return false;
        });

        this.tiles.getRow(0).forEach((_, x) => {
            this.tiles.getColumn(x).forEach((v, y) => {
                if (this.isNumberInTileRange(v)) return;
                
                if (!this.tiles.getSection(x - 1, y - 1, 3, 3).reduce((result, tile) => result || this.isNumberInTileRange(tile), false)) return;
                const collider = verticalColliders.find(({
                    x: cx,
                    y: cy,
                    height
                }) => (cx === x) && (cy === (y - height)));
                
                collider ? collider.height++ : verticalColliders.push({
                    x,
                    y,
                    width: 1,
                    height: 1
                });
            });
        });

        // const checkedTiles = new Grid<boolean>(this.mapWidth, this.mapHeight);

        // this.tiles.forEach((v, x, y) => {
        //     if (checkedTiles.get(x, y)) return;
        //     checkedTiles.set(true, x, y);

        //     if (this.isNumberInTileRange(v)) return;
        //     const section = this.tiles.getSection(x, y, this.tiles.getRow(y).slice(x).findIndex((v) => this.isNumberInTileRange(v)) + 1, this.tiles.getColumn(x).slice(y).findIndex((v) => this.isNumberInTileRange(v)) + 1);
        //     const height = section.height;
        //     const width = section.raw().reduce((v, a, sy) => Math.min(v, a.findIndex((v, sx) => {
        //         checkedTiles.set(true, sx + x, sy + y);
        //         return this.isNumberInTileRange(v);
        //     })), section.width - 1);

        //     this.queue.push({ x, y, width, height });
        // });
        
        // if (![tiles.get(x + 1, y), tiles.get(x - 1, y), tiles.get(x, y + 1), tiles.get(x, y - 1)].some((v) => isNumberInRange(v, averageTileWeight - TILE.OFFSET.MIN, averageTileWeight + TILE.OFFSET.MAX))) continue;
                // tile.solid = true;

                // if (isNumberInRange(tiles.get(x - 1, y), averageTileWeight - TILE.OFFSET.MIN, averageTileWeight + TILE.OFFSET.MAX)) {
                //     const tile = this.map.tiles.find(({
                //         x: tx,
                //         y: ty
                //     }) => (tx === Math.max((x - 1), 0) && (ty === y)))!;

                //     const collider = tile.getColliders()[0];
                //     let width: number = 0;
                //     let height: number = 0;

                //     if (collider) {
                //         width = collider.bounds.width;
                //         height = collider.bounds.height;

                //         tile.removeCollider(collider);
                //     }
                    
                //     tile.addCollider(ex.Shape.Box(width + TILE.WIDTH, height + TILE.HEIGHT, ex.Vector.Zero));

                //     continue;
                // }
        
        const colliders = horizontalColliders.concat(verticalColliders).filter(({ width, height }) => [width, height].some((v) => v > 1));
        if (createBorders) {
            const borders: Tile[] = [{
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT
            }, {
                x: -Map.BORDER_WIDTH,
                y: this.mapHeight,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT
            }, {
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT)
            }, {
                x: this.mapWidth,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT)
            }];

            this.renderQueue.push(...borders);
            colliders.push(...borders);
        }  

        this.collider.useCompositeCollider(colliders.map(({ x, y, width, height }) => ex.Shape.Box(width, height, ex.Vector.Zero, ex.vec(x, y))));
    }
    isNumberInTileRange(v: number) {
        return isNumberInRange(v, this.averageTileWeight - TILE.OFFSET.MIN, this.averageTileWeight + TILE.OFFSET.MAX);
    }

    offsetVectorByBorder([x, y]: Vector): Vector {
        return [x + ((this.mapWidth + (2 * Map.BORDER_WIDTH)) * TILE.WIDTH), y + ((this.mapHeight + (2 * Map.BORDER_HEIGHT)) * TILE.HEIGHT)];
    }
}