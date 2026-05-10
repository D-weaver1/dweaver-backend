import { Pair } from "../types/pair.type";

/**
 * Повертає лише ті пари слів, які реально потребують перекладу.
 *
 * Пара вважається перекладною, якщо вихідний текст відрізняється
 * від цільового тексту. Пари з однаковими source_text і target_text
 * не враховуються, оскільки їх заміна не змінює текст.
 */

export function getTranslatablePairs(pairs: Pair[]): Pair[] {
    return pairs.filter((pair) => pair.source_text !== pair.target_text);
}
