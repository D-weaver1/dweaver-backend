import { isPunctuation } from "./punctuation.util";

const PARAGRAPH_BREAK_UNIT = "\n\n";

/**
 * buildTextFromUnits збирає готовий текст із масиву текстових одиниць.
 *
 * Функція додає пробіли між словами, але не додає пробіл
 * перед знаками пунктуації, щоб сформований текст мав коректний вигляд.
 */

export function buildTextFromUnits(textUnits: string[]): string {
    let result = "";

    for (const unit of textUnits) {
        if (unit === PARAGRAPH_BREAK_UNIT) {
            result = `${result.trimEnd()}${PARAGRAPH_BREAK_UNIT}`;
            continue;
        }

        if (!result || result.endsWith(PARAGRAPH_BREAK_UNIT)) {
            result += unit;
            continue;
        }

        if (isPunctuation(unit)) {
            result += unit;
        } else {
            result += ` ${unit}`;
        }
    }

    return result.trim();
}
