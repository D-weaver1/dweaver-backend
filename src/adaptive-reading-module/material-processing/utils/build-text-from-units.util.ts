import {
    shouldAttachNextToPrevious,
    shouldAttachToPrevious,
} from "./punctuation.util";

const PARAGRAPH_BREAK_UNIT = "\n\n";

/**
 * buildTextFromUnits збирає готовий текст із масиву текстових одиниць.
 *
 * Функція додає пробіли між словами, але не додає пробіл
 * перед знаками пунктуації, щоб сформований текст мав коректний вигляд.
 */

export function buildTextFromUnits(textUnits: string[]): string {
    let result = "";
    let previousUnit: string | null = null;

    for (const unit of textUnits) {
        if (unit === PARAGRAPH_BREAK_UNIT) {
            result = `${result.trimEnd()}${PARAGRAPH_BREAK_UNIT}`;
            previousUnit = unit;
            continue;
        }

        if (!result || result.endsWith(PARAGRAPH_BREAK_UNIT)) {
            result += unit;
            previousUnit = unit;
            continue;
        }

        if (
            shouldAttachToPrevious(unit) ||
            (previousUnit !== null && shouldAttachNextToPrevious(previousUnit))
        ) {
            result += unit;
        } else {
            result += ` ${unit}`;
        }

        previousUnit = unit;
    }

    return result.trim();
}
