import { AiAnalysisResult, AiPair } from "../types/ai-analysis-result.type";

const PARAGRAPH_BREAK_UNIT = "\n\n";

const PUNCTUATION_UNITS = new Set([
    ".",
    ",",
    "!",
    "?",
    ":",
    ";",
    "…",
    "—",
    "(",
    ")",
    "«",
    "»",
]);

export class ResponseValidatorService {
    validate(data: unknown): AiAnalysisResult {
        if (!this.isObject(data)) {
            throw new Error("AI response must be an object");
        }

        const {
            title,
            source_language,
            target_language,
            original_text,
            text_units,
            pairs,
        } = data;

        if (typeof title !== "string" || !title.trim()) {
            throw new Error("AI response title is invalid");
        }

        if (typeof source_language !== "string" || !source_language.trim()) {
            throw new Error("AI response source_language is invalid");
        }

        if (typeof target_language !== "string" || !target_language.trim()) {
            throw new Error("AI response target_language is invalid");
        }

        if (typeof original_text !== "string" || !original_text.trim()) {
            throw new Error("AI response original_text is invalid");
        }

        if (!Array.isArray(text_units) || text_units.length === 0) {
            throw new Error("AI response text_units is invalid");
        }

        const normalizedTextUnits = text_units.map((unit, unitIndex) => {
            if (typeof unit !== "string") {
                throw new Error(
                    `AI response text_units item at index ${unitIndex} is invalid`
                );
            }

            return this.normalizeTextUnit(unit, unitIndex);
        });

        if (!Array.isArray(pairs) || pairs.length === 0) {
            throw new Error("AI response pairs is invalid");
        }

        const validatedPairs: AiPair[] = pairs.map((pair, pairIndex) => {
            if (!this.isObject(pair)) {
                throw new Error(`Pair at index ${pairIndex} must be an object`);
            }

            const { source_text, target_text, occurrence_indexes } = pair;

            if (typeof source_text !== "string" || !source_text.trim()) {
                throw new Error(
                    `Pair at index ${pairIndex} has invalid source_text`
                );
            }

            if (typeof target_text !== "string" || !target_text.trim()) {
                throw new Error(
                    `Pair at index ${pairIndex} has invalid target_text`
                );
            }

            const normalizedSourceText = source_text.trim();
            const normalizedTargetText = target_text.trim();

            if (this.isStructuralUnit(normalizedSourceText)) {
                throw new Error(
                    `Pair at index ${pairIndex} must not use punctuation or paragraph break as source_text`
                );
            }

            if (this.looksLikeSentence(normalizedSourceText)) {
                throw new Error(
                    `Pair at index ${pairIndex} looks like a sentence, not a lexical unit`
                );
            }

            if (this.isTooLongLexicalUnit(normalizedSourceText)) {
                throw new Error(
                    `Pair at index ${pairIndex} is too long for a lexical unit`
                );
            }

            if (
                !Array.isArray(occurrence_indexes) ||
                occurrence_indexes.length === 0 ||
                !occurrence_indexes.every(
                    (index) =>
                        Number.isInteger(index) &&
                        index >= 0 &&
                        index < normalizedTextUnits.length
                )
            ) {
                throw new Error(
                    `Pair at index ${pairIndex} has invalid occurrence_indexes`
                );
            }

            const uniqueIndexes = [...new Set(occurrence_indexes)];

            for (const index of uniqueIndexes) {
                const unitAtIndex = normalizedTextUnits[index];

                if (this.isStructuralUnit(unitAtIndex)) {
                    throw new Error(
                        `Pair at index ${pairIndex} points to punctuation or paragraph break at position ${index}`
                    );
                }

                if (unitAtIndex !== normalizedSourceText) {
                    throw new Error(
                        `Pair at index ${pairIndex} does not match text_units at position ${index}: expected "${normalizedSourceText}", got "${unitAtIndex}"`
                    );
                }
            }

            return {
                source_text: normalizedSourceText,
                target_text: normalizedTargetText,
                occurrence_indexes: uniqueIndexes,
            };
        });

        return {
            title: title.trim(),
            source_language: source_language.trim(),
            target_language: target_language.trim(),
            original_text: original_text.trim(),
            text_units: normalizedTextUnits,
            pairs: validatedPairs,
        };
    }

    private normalizeTextUnit(unit: string, unitIndex: number): string {
        if (this.isParagraphBreak(unit)) {
            return PARAGRAPH_BREAK_UNIT;
        }

        const normalizedUnit = unit.trim();

        if (!normalizedUnit) {
            throw new Error(
                `AI response text_units item at index ${unitIndex} is empty`
            );
        }

        return normalizedUnit;
    }

    private isStructuralUnit(value: string): boolean {
        return this.isParagraphBreak(value) || this.isPunctuation(value);
    }

    private isParagraphBreak(value: string): boolean {
        return value === PARAGRAPH_BREAK_UNIT || value.trim() === "\\n\\n";
    }

    private isPunctuation(value: string): boolean {
        return PUNCTUATION_UNITS.has(value.trim());
    }

    private looksLikeSentence(value: string): boolean {
        const trimmed = value.trim();

        if (this.isPunctuation(trimmed)) {
            return false;
        }

        return /[.!?]$/.test(trimmed);
    }

    private isTooLongLexicalUnit(value: string): boolean {
        const words = value.trim().split(/\s+/);
        return words.length > 4;
    }

    private isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }
}
