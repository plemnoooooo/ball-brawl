export class Random {
    private static readonly BASE_64_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    static number(max: number = 1, min: number = 0, isInt: boolean = true) {
        const n = (Math.random() * (max - min)) + min;
        return isInt ? Math.floor(n) : n;
    }

    static select(i: any[] | Record<any, any>, times: number = 1): any[] {
        return Array(times).fill(null).map(() => Array.isArray(i) ? i[this.number(i.length)] : i[this.select(Object.keys(i))[0]]);
    }

    static generateBase64(length: number = 8) {
        return Array(length).fill(null).map(() => Random.BASE_64_CHARACTERS[Random.number(64)]).join("");
    }
}