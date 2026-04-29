import { Pair } from "../types/pair.type";
import { buildTextFromUnits } from "../utils/build-text-from-units.util";

export function generateLevelText(
    textUnits: string[],
    currentPairs: Pair[]
): string {
    const levelTextUnits = [...textUnits];

    for (const pair of currentPairs) {
        for (const index of pair.occurrence_indexes) {
            levelTextUnits[index] = pair.target_text;
        }
    }

    return buildTextFromUnits(levelTextUnits);
}
