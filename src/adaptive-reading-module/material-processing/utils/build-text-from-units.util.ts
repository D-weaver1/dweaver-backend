import { isPunctuation } from "./punctuation.util";

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
