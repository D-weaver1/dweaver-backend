export function calculateLevelCount(
    totalTranslatableCount: number,
    factor: number
): number {
    if (totalTranslatableCount === 0) {
        return 0;
    }

    const count = Math.floor((totalTranslatableCount * factor) / 100);

    if (factor > 0 && count === 0) {
        return 1;
    }

    return count;
}
