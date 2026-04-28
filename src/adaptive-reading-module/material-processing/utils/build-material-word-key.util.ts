export function buildMaterialWordKey(
    sourceText: string,
    targetText: string,
    occurrenceIndexes: number[],
    languagePairId: number
): string {
    return `${sourceText}::${targetText}::${occurrenceIndexes.join(",")}::${languagePairId}`;
}
