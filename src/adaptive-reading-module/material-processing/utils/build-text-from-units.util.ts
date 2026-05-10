import { isPunctuation } from "./punctuation.util";

/**
 * buildTextFromUnits збирає готовий текст із масиву текстових одиниць.
 *
 * Функція додає пробіли між словами, але не додає пробіл
 * перед знаками пунктуації, щоб сформований текст мав коректний вигляд.
 */

export function buildTextFromUnits(textUnits: string[]): string {
    let result = "";

    for (const unit of textUnits) {
        if (!result) {
            result += unit;
            continue;
        }

        if (isPunctuation(unit)) {
            result += unit;
        } else {
            result += ` ${unit}`;
        }
    }

    return result;
}
