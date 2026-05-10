/**
 * Обчислює кількість слів для рівня перекладу на основі відсоткового коефіцієнта.
 * Якщо текст короткий і результат округлення дорівнює 0, повертає мінімум 1 слово
 * для будь-якого ненульового коефіцієнта.
 */

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
