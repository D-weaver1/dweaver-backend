import { DataSource } from "typeorm";
import { CreateMaterialProcessingDto } from "./dto/create-material-processing.dto";
import { MATERIAL_LEVEL_FACTORS } from "./constants/material-level-factors.constant";
import { getTranslatablePairs } from "./algorithms/get-translatable-pairs.algorithm";
import { distributePairs } from "./algorithms/distribute-pairs.algorithm";
import { calculateLevelCount } from "./algorithms/calculate-level-count.algorithm";
import { generateLevelText } from "./algorithms/generate-level-text.algorithm";
import { LanguagePairRepository } from "./repositories/language-pair.repository";
import { MaterialProcessingRepository } from "./repositories/material-processing.repository";

export class MaterialProcessingService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly languagePairRepository: LanguagePairRepository,
        private readonly materialProcessingRepository: MaterialProcessingRepository
    ) {}

    async createMaterialFromJson(dto: CreateMaterialProcessingDto) {
        return this.dataSource.transaction(async (manager) => {
            const languagePairId =
                await this.languagePairRepository.findLanguagePairId(
                    manager,
                    dto.source_language,
                    dto.target_language
                );

            const material =
                await this.materialProcessingRepository.createMaterial(
                    manager,
                    {
                        title: dto.title,
                        text: dto.original_text,
                        languageLevel: dto.language_level,
                        languagePairId,
                    }
                );

            await this.materialProcessingRepository.insertWordsIgnoreConflicts(
                manager,
                dto.pairs,
                languagePairId
            );

            const translatablePairs = getTranslatablePairs(dto.pairs);

            const totalTranslatableCount = translatablePairs.length;

            const distributedPairs = distributePairs(translatablePairs);

            const maxFactor = Math.max(...MATERIAL_LEVEL_FACTORS);

            const maxCount = calculateLevelCount(
                totalTranslatableCount,
                maxFactor
            );

            const selectedPairsForMaterialWord = distributedPairs.slice(
                0,
                maxCount
            );

            const wordMap = await this.materialProcessingRepository.getWordMap(
                manager,
                selectedPairsForMaterialWord,
                languagePairId
            );

            const materialWordMap =
                await this.materialProcessingRepository.createMaterialWords(
                    manager,
                    material.id,
                    selectedPairsForMaterialWord,
                    wordMap,
                    languagePairId
                );

            const createdLevels = [];

            for (const factor of MATERIAL_LEVEL_FACTORS) {
                const currentCount = Math.min(
                    calculateLevelCount(totalTranslatableCount, factor),
                    maxCount
                );

                const currentPairs = distributedPairs.slice(0, currentCount);

                const levelText = generateLevelText(
                    dto.text_units,
                    currentPairs
                );

                const materialLevel =
                    await this.materialProcessingRepository.createMaterialLevel(
                        manager,
                        material.id,
                        factor,
                        levelText
                    );

                await this.materialProcessingRepository.createMaterialLevelWords(
                    manager,
                    materialLevel.id,
                    currentPairs,
                    materialWordMap,
                    languagePairId
                );

                createdLevels.push({
                    id: materialLevel.id,
                    factor,
                    currentCount,
                    text: levelText,
                });
            }

            return {
                materialId: material.id,
                languagePairId,
                totalTranslatableCount,
                maxFactor,
                maxCount,
                createdLevels,
            };
        });
    }
}
