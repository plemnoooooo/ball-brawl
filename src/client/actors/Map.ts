import * as ex from "excalibur";
import { TILE } from "../../global/constants";
import { Grid, findAverage, isNumberInRange } from "../../global/utils";
import { Collider, Tile } from "../types";

export class Map extends ex.Actor {
    static readonly TAG_NAME = "map";
    static readonly TILE_COLOR = ex.Color.White;
    
    static readonly BORDER_WIDTH = 100;
    static readonly BORDER_HEIGHT = 100;

    public mapWidth: number;
    public mapHeight: number;
    public pixelWidth: number;
    public pixelHeight: number;

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
                ctx.drawRectangle(ex.vec(x, y), width, height + (1 / TILE.HEIGHT), Map.TILE_COLOR);
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
        const horizontalColliders: Collider[] = [];
        const verticalColliders: Collider[] = [];

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

            if (!this.tiles.getAdjacentTiles(x, y).slice(2).reduce((result, tile) => result || this.isNumberInTileRange(tile), false)) return;
                const collider = horizontalColliders.find(({
                    x: cx,
                    y: cy,
                    width
                }) => (cx === (x - width)) && (cy === y));
                
                collider ? collider.width++ : horizontalColliders.push({
                    x,
                    y,
                    width: 1,
                    height: 0.01,
                    anchor: [0, +this.isNumberInTileRange(this.tiles.get(x, y + 1))]
                });
        }, (a, y) => {
            const x = a.findIndex((v) => !this.isNumberInTileRange(v));
            this.renderQueue.push({
                x,
                y,
                width: 0,
                height: 1
            });

            // horizontalColliders.push({
            //     x,
            //     y,
            //     width: 0,
            //     height: 0.01,
            //     anchor: [0, +this.isNumberInTileRange(this.tiles.get(x, y + 1))]
            // });

            return false;
        });

        this.tiles.getRow(0).forEach((_, x) => {
            this.tiles.getColumn(x).forEach((v, y) => {
                if (this.isNumberInTileRange(v)) return;
                
                if (!this.tiles.getAdjacentTiles(x, y).slice(0, 2).reduce((result, tile) => result || this.isNumberInTileRange(tile), false)) return;
                const collider = verticalColliders.find(({
                    x: cx,
                    y: cy,
                    height,
                }) => (cx === x) && (cy === (y - height)));
                
                collider ? collider.height++ : verticalColliders.push({
                    x,
                    y,
                    width: 0.01,
                    height: 1,
                    anchor: [+this.isNumberInTileRange(this.tiles.get(x + 1, y)), 0]
                });
            });
        });

        const colliders = horizontalColliders.concat(verticalColliders);
        if (createBorders) {
            const borders: Collider[] = [{
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT,
                anchor: [0, 0]
            }, {
                x: -Map.BORDER_WIDTH,
                y: this.mapHeight,
                width: this.mapWidth + (2 * Map.BORDER_WIDTH),
                height: Map.BORDER_HEIGHT,
                anchor: [0, 0]
            }, {
                x: -Map.BORDER_WIDTH,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT),
                anchor: [0, 0]
            }, {
                x: this.mapWidth,
                y: -Map.BORDER_HEIGHT,
                width: Map.BORDER_WIDTH,
                height: this.mapHeight + (2 * Map.BORDER_HEIGHT),
                anchor: [0, 0]
            }];

            this.renderQueue.push(...borders);
            colliders.push(...borders);
        }  

        this.collider.useCompositeCollider(colliders.map(({ x, y, width, height, anchor: [mx, my] }) => ex.Shape.Box(width, height, ex.Vector.Zero, ex.vec(x + mx, y + my))));
    }

    isNumberInTileRange(v: number) {
        return isNumberInRange(v, this.averageTileWeight - TILE.OFFSET.MIN, this.averageTileWeight + TILE.OFFSET.MAX);
    }
}