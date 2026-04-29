import { Pair } from "../types/pair.type";

export function getTranslatablePairs(pairs: Pair[]): Pair[] {
    return pairs.filter((pair) => pair.source_text !== pair.target_text);
}
