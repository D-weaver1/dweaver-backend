import { MaterialLevelRepository } from "./repositories/material-level.repository";
import { UserMaterialStatus } from "../../entities/enums";
type ReadingUnit = {
    index: number;
    text: string;
    isTranslated: boolean;
    spaceAfter: boolean;
    wordId?: string;
    materialWordId?: string;
    sourceText?: string;
    targetText?: string;
};

export class MaterialLevelService {
    constructor(
        private readonly materialLevelRepository: MaterialLevelRepository
    ) {}

    async getMaterialLevels(materialId: string, userId: string) {
        const levels =
            await this.materialLevelRepository.findLevelsByMaterialId(
                materialId
            );

        const progressRecords =
            await this.materialLevelRepository.findUserMaterialLevelsByLevelIds(
                userId,
                levels.map((level) => level.id)
            );

        const progressByLevelId = new Map<string, UserMaterialStatus>();

        for (const progress of progressRecords) {
            progressByLevelId.set(progress.materialLevel.id, progress.status);
        }

        return levels.map((level) => ({
            id: level.id,
            factor: level.factor,
            status:
                progressByLevelId.get(level.id) ??
                UserMaterialStatus.NOT_STARTED,
        }));
    }

    async getMaterialLevelReading(
        materialId: string,
        levelId: string,
        userId: string
    ) {
        const material =
            await this.materialLevelRepository.findMaterialById(materialId);

        if (!material) {
            throw new Error("Material not found");
        }

        if (
            !Array.isArray(material.textUnits) ||
            material.textUnits.length === 0
        ) {
            throw new Error(
                "Material text_units are empty. Reimport this material from JSON."
            );
        }

        const materialLevel =
            await this.materialLevelRepository.findLevelByMaterialId(
                materialId,
                levelId
            );

        if (!materialLevel) {
            throw new Error("Material level not found");
        }

        const progress =
            await this.materialLevelRepository.findUserMaterialLevel(
                userId,
                levelId
            );

        const levelWords =
            await this.materialLevelRepository.findLevelWords(levelId);

        const translatedByIndex = new Map<
            number,
            {
                wordId: string;
                materialWordId: string;
                sourceText: string;
                targetText: string;
            }
        >();

        const translatedWordsMap = new Map<
            string,
            {
                wordId: string;
                materialWordId: string;
                sourceText: string;
                targetText: string;
            }
        >();

        for (const levelWord of levelWords) {
            const materialWord = levelWord.materialWord;
            const word = materialWord.word;

            translatedWordsMap.set(materialWord.id, {
                wordId: word.id,
                materialWordId: materialWord.id,
                sourceText: word.sourceText,
                targetText: word.translation,
            });

            for (const index of materialWord.indexes) {
                translatedByIndex.set(index, {
                    wordId: word.id,
                    materialWordId: materialWord.id,
                    sourceText: word.sourceText,
                    targetText: word.translation,
                });
            }
        }

        const rawUnits: Omit<ReadingUnit, "spaceAfter">[] =
            material.textUnits.map((sourceUnit, index) => {
                const translated = translatedByIndex.get(index);

                if (!translated) {
                    return {
                        index,
                        text: sourceUnit,
                        isTranslated: false,
                    };
                }

                return {
                    index,
                    text: translated.targetText,
                    isTranslated: true,
                    wordId: translated.wordId,
                    materialWordId: translated.materialWordId,
                    sourceText: translated.sourceText,
                    targetText: translated.targetText,
                };
            });

        const units: ReadingUnit[] = rawUnits.map((unit, index) => ({
            ...unit,
            spaceAfter: shouldAddSpaceAfter(
                unit.text,
                rawUnits[index + 1]?.text
            ),
        }));

        return {
            materialId: material.id,
            levelId: materialLevel.id,
            factor: materialLevel.factor,
            text: materialLevel.text,
            progressStatus: progress?.status ?? UserMaterialStatus.NOT_STARTED,
            units,
            translatedWords: Array.from(translatedWordsMap.values()),
        };
    }

    async startMaterialLevel(
        materialId: string,
        levelId: string,
        userId: string
    ) {
        const materialLevel =
            await this.materialLevelRepository.findLevelByMaterialId(
                materialId,
                levelId
            );

        if (!materialLevel) {
            throw new Error("Material level not found");
        }

        const existing =
            await this.materialLevelRepository.findUserMaterialLevel(
                userId,
                levelId
            );

        if (existing?.status === UserMaterialStatus.COMPLETED) {
            return {
                materialId,
                levelId,
                status: existing.status,
            };
        }

        const progress =
            await this.materialLevelRepository.saveUserMaterialLevel(
                userId,
                levelId,
                UserMaterialStatus.IN_PROGRESS
            );

        return {
            materialId,
            levelId,
            status: progress.status,
        };
    }

    async completeMaterialLevel(
        materialId: string,
        levelId: string,
        userId: string
    ) {
        const materialLevel =
            await this.materialLevelRepository.findLevelByMaterialId(
                materialId,
                levelId
            );

        if (!materialLevel) {
            throw new Error("Material level not found");
        }

        const progress =
            await this.materialLevelRepository.saveUserMaterialLevel(
                userId,
                levelId,
                UserMaterialStatus.COMPLETED
            );

        return {
            materialId,
            levelId,
            status: progress.status,
        };
    }

    async getMaterialsProgressSummary(userId: string, materialIds?: string[]) {
        const summaries =
            await this.materialLevelRepository.getMaterialsProgressSummary(
                userId,
                materialIds
            );

        return {
            summaries,
        };
    }
}

function shouldAddSpaceAfter(currentText: string, nextText?: string): boolean {
    if (!nextText) {
        return false;
    }

    const noSpaceBefore = new Set([
        ",",
        ".",
        "!",
        "?",
        ":",
        ";",
        ")",
        "]",
        "}",
    ]);

    const noSpaceAfter = new Set(["(", "[", "{"]);

    if (noSpaceBefore.has(nextText)) {
        return false;
    }

    if (noSpaceAfter.has(currentText)) {
        return false;
    }

    return true;
}
