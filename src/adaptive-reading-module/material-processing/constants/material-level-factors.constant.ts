/**
 * Відсоткові коефіцієнти для формування рівнів перекладу матеріалу.
 */
export const MATERIAL_LEVEL_FACTORS = [20, 40, 60, 80] as const;

/**
 * Тип одного допустимого коефіцієнта з MATERIAL_LEVEL_FACTORS.
 *
 * Завдяки [number] TypeScript бере не тип усього масиву,
 * а тип одного з його елементів: 20 | 40 | 60 | 80.
 */
export type MaterialLevelFactor = (typeof MATERIAL_LEVEL_FACTORS)[number];
