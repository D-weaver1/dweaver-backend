/**
 * Формує унікальний ключ для пошуку word у Map.
 *
 * Ключ створюється через JSON.stringify, щоб безпечно враховувати
 * вихідний текст, переклад та ідентифікатор мовної пари
 */

export function buildPairKey(
    sourceText: string,
    targetText: string,
    languagePairId: string
): string {
    return JSON.stringify([sourceText, targetText, languagePairId]);
}
