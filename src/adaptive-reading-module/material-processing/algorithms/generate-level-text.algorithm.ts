import { Pair } from "../types/pair.type";
import { buildTextFromUnits } from "../utils/build-text-from-units.util";

/**
 * generateLevelText генерує текст для конкретного рівня перекладу.
 *
 * Функція створює копію вихідних текстових одиниць,
 * замінює вибрані слова на їх переклад відповідно до індексів появи
 * та повертає зібраний текст із правильними пробілами і пунктуацією.
 */

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
