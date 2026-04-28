export const MATERIAL_LEVEL_FACTORS = [20, 40, 60, 80] as const;

export type MaterialLevelFactor = (typeof MATERIAL_LEVEL_FACTORS)[number];
