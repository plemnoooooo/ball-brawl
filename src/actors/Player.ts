import * as ex from "excalibur";
import { Player as PlayerData } from "../types";

export class Player extends ex.Actor {
    static readonly DEFAULT_USERNAME = "Player";

    constructor(public username: string = Player.DEFAULT_USERNAME) {
        super({
            radius: 10,
            color: ex.Color.Red
        });
    }
    
    serialize(): PlayerData {
        return {
            x: this.pos.x,
            y: this.pos.y,
            username: this.username
        };
    }

    deserialize({ x, y, username }: Partial<PlayerData>) {
        this.pos.setTo(x || this.pos.x, y || this.pos.y);
        
        if (username) this.username = username;
    }
}