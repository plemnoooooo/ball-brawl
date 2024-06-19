import { Vector } from "../../global/types";
import { Tile } from ".";

export type Collider = Tile & { anchor: Vector };