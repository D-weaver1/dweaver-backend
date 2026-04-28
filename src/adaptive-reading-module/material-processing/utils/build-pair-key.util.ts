export function buildPairKey(
    sourceText: string,
    targetText: string,
    languagePairId: number
): string {
    return `${sourceText}::${targetText}::${languagePairId}`;
}
