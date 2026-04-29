import { Pair } from "../types/pair.type";

type Range = {
    start: number;
    end: number;
};

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
