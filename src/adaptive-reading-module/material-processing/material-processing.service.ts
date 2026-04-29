import { CreateMaterialProcessingDto } from "./dto/create-material-processing.dto";
import { MATERIAL_LEVEL_FACTORS } from "./constants/material-level-factors.constant";
import { getTranslatablePairs } from "./algorithms/get-translatable-pairs.algorithm";
import { distributePairs } from "./algorithms/distribute-pairs.algorithm";
import { calculateLevelCount } from "./algorithms/calculate-level-count.algorithm";
import { generateLevelText } from "./algorithms/generate-level-text.algorithm";

export class MaterialProcessingService {
    createMaterialFromJson(dto: CreateMaterialProcessingDto) {
        const translatablePairs = getTranslatablePairs(dto.pairs);

        const totalTranslatableCount = translatablePairs.length;

        const distributedPairs = distributePairs(translatablePairs);

        const maxFactor = Math.max(...MATERIAL_LEVEL_FACTORS);

        const maxCount = calculateLevelCount(totalTranslatableCount, maxFactor);

        const selectedPairsForMaterialWord = distributedPairs.slice(
            0,
            maxCount
        );

        const generatedLevels = MATERIAL_LEVEL_FACTORS.map((factor) => {
            const currentCount = Math.min(
                calculateLevelCount(totalTranslatableCount, factor),
                maxCount
            );

            const currentPairs = distributedPairs.slice(0, currentCount);

            const levelText = generateLevelText(dto.text_units, currentPairs);

            return {
                factor,
                currentCount,
                levelText,
                pairs: currentPairs,
            };
        });

        return {
            title: dto.title,
            languageLevel: dto.language_level,
            sourceLanguage: dto.source_language,
            targetLanguage: dto.target_language,
            totalTranslatableCount,
            maxFactor,
            maxCount,
            selectedPairsForMaterialWord,
            generatedLevels,
        };
    }
}
