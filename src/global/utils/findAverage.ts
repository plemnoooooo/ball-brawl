export function findAverage(i: number[] | Record<any, number>) {
    const a = Array.isArray(i) ? i : Object.values(i);
    return a.reduce((a, b) => a + b, 0) / a.length;
}