/**
 * Формує унікальний ключ для пошуку material_word у Map.
 *
 * Ключ створюється через JSON.stringify, щоб безпечно враховувати
 * вихідний текст, переклад, індекси появи слова в матеріалі
 * та ідентифікатор мовної пари без ризику конфліктів через розділювачі.
 */

export function buildMaterialWordKey(
    sourceText: string,
    targetText: string,
    occurrenceIndexes: number[],
    languagePairId: number
): string {
    return JSON.stringify([
        sourceText,
        targetText,
        occurrenceIndexes,
        languagePairId,
    ]);
}
