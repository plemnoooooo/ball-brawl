export function isNumberInRange(v: number, min: number, max: number, clampNumber?: false): boolean;
export function isNumberInRange(v: number, min: number, max: number, clampNumber?: true): number;
export function isNumberInRange(v: number, min: number, max: number, clampNumber: boolean = false) {
    const newValue = Math.max(Math.min(v, max), min);
    return clampNumber ? newValue : v === newValue;
}