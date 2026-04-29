import { Pair } from "../types/pair.type";

type Range = {
    start: number;
    end: number;
};

/**
 * distributePairs розподіляє пари слів у більш рівномірному порядку за текстом.
 *
 * Спочатку сортує пари за першим індексом появи в тексті,
 * після чого формує новий порядок через вибір середини кожного діапазону.
 * Це потрібно, щоб під час вибору частини пар для рівня перекладу
 * слова бралися не лише з початку тексту, а з різних його частин.
 */

export function distributePairs(pairs: Pair[]): Pair[] {
    const sortedPairs = [...pairs].sort(
        (a, b) => a.occurrence_indexes[0] - b.occurrence_indexes[0]
    );

    const result: Pair[] = [];
    const ranges: Range[] = [
        {
            start: 0,
            end: sortedPairs.length - 1,
        },
    ];

    while (ranges.length > 0) {
        const currentRange = ranges.shift();

        if (!currentRange) {
            continue;
        }

        const { start, end } = currentRange;

        if (start > end) {
            continue;
        }

        const middle = Math.floor((start + end) / 2);

        result.push(sortedPairs[middle]);

        ranges.push({
            start,
            end: middle - 1,
        });

        ranges.push({
            start: middle + 1,
            end,
        });
    }

    return result;
}
