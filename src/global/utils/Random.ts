export class Random {
    private static readonly BASE_64_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    static number(max: number = 1, min: number = 0, isInt: boolean = true) {
        const n = (Math.random() * (max - min)) + min;
        return isInt ? Math.floor(n) : n;
    }

    static select<T>(i: T[] | Record<any, T>, times?: 1): T;
    static select<T>(i: T[] | Record<any, T>, times?: number): T[];
    static select<T>(i: T[] | Record<any, T>, times: number = 1): T | T[] {
        const result = Array(times).fill(null).map(() => Array.isArray(i) ? i[this.number(i.length)] : i[this.select(Object.keys(i))]);
        return (times === 1) ? result[0] : result;
    }

    static generateBase64(length: number = 8) {
        return Array(length).fill(null).map(() => Random.BASE_64_CHARACTERS[Random.number(64)]).join("");
    }
}