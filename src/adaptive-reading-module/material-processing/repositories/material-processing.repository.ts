import { EntityManager, FindOptionsWhere } from "typeorm";
import {
    LanguageLevel,
    LanguagePair,
    Material,
    MaterialLevel,
    MaterialLevelMaterialWord,
    MaterialWord,
    Word,
} from "../../../entities";
import { Pair } from "../types/pair.type";
import { buildPairKey } from "../utils/build-pair-key.util";
import { buildMaterialWordKey } from "../utils/build-material-word-key.util";

type CreateMaterialInput = {
    title: string;
    text: string;
    textUnits: string[];
    languageLevel: string;
    languagePairId: string;
};
export class MaterialProcessingRepository {
    async createMaterial(
        manager: EntityManager,
        input: CreateMaterialInput
    ): Promise<Material> {
        const materialRepository = manager.getRepository(Material);

        const material = materialRepository.create({
            title: input.title,
            text: input.text,
            textUnits: input.textUnits,
            languageLevel: input.languageLevel as LanguageLevel,
            languagePair: {
                id: input.languagePairId,
            } as LanguagePair,
        });

        return materialRepository.save(material);
    }

    async insertWordsIgnoreConflicts(
        manager: EntityManager,
        pairs: Pair[],
        languagePairId: string
    ): Promise<void> {
        if (pairs.length === 0) {
            return;
        }

        const wordRepository = manager.getRepository(Word);

        const words = pairs.map((pair) =>
            wordRepository.create({
                sourceText: pair.source_text,
                translation: pair.target_text,
                languagePair: {
                    id: languagePairId,
                } as LanguagePair,
            })
        );

        await wordRepository
            .createQueryBuilder()
            .insert()
            .into(Word)
            .values(words)
            .orIgnore()
            .execute();
    }

    async getWordMap(
        manager: EntityManager,
        pairs: Pair[],
        languagePairId: string
    ): Promise<Map<string, string>> {
        const wordMap = new Map<string, string>();

        if (pairs.length === 0) {
            return wordMap;
        }

        const wordRepository = manager.getRepository(Word);

        const where: FindOptionsWhere<Word>[] = pairs.map((pair) => ({
            sourceText: pair.source_text,
            translation: pair.target_text,
            languagePair: {
                id: languagePairId,
            },
        }));

        const words = await wordRepository.find({
            where,
        });

        for (const word of words) {
            const key = buildPairKey(
                word.sourceText,
                word.translation,
                languagePairId
            );

            wordMap.set(key, word.id);
        }

        for (const pair of pairs) {
            const key = buildPairKey(
                pair.source_text,
                pair.target_text,
                languagePairId
            );

            if (!wordMap.has(key)) {
                throw new Error(
                    `Word was not found after insert: ${pair.source_text} -> ${pair.target_text}`
                );
            }
        }

        return wordMap;
    }

    async createMaterialWords(
        manager: EntityManager,
        materialId: string,
        pairs: Pair[],
        wordMap: Map<string, string>,
        languagePairId: string
    ): Promise<Map<string, string>> {
        const materialWordRepository = manager.getRepository(MaterialWord);

        const materialWords = pairs.map((pair) => {
            const wordKey = buildPairKey(
                pair.source_text,
                pair.target_text,
                languagePairId
            );

            const wordId = wordMap.get(wordKey);

            if (!wordId) {
                throw new Error(
                    `wordId not found for pair: ${pair.source_text} -> ${pair.target_text}`
                );
            }

            return materialWordRepository.create({
                indexes: pair.occurrence_indexes,
                word: {
                    id: wordId,
                } as Word,
                material: {
                    id: materialId,
                } as Material,
            });
        });

        const savedMaterialWords =
            await materialWordRepository.save(materialWords);

        const materialWordMap = new Map<string, string>();

        for (let index = 0; index < pairs.length; index++) {
            const pair = pairs[index];
            const materialWord = savedMaterialWords[index];

            const key = buildMaterialWordKey(
                pair.source_text,
                pair.target_text,
                pair.occurrence_indexes,
                languagePairId
            );

            materialWordMap.set(key, materialWord.id);
        }

        return materialWordMap;
    }

    async createMaterialLevel(
        manager: EntityManager,
        materialId: string,
        factor: number,
        text: string
    ): Promise<MaterialLevel> {
        const materialLevelRepository = manager.getRepository(MaterialLevel);

        const materialLevel = materialLevelRepository.create({
            factor,
            text,
            material: {
                id: materialId,
            } as Material,
        });

        return materialLevelRepository.save(materialLevel);
    }

    async createMaterialLevelWords(
        manager: EntityManager,
        materialLevelId: string,
        pairs: Pair[],
        materialWordMap: Map<string, string>,
        languagePairId: string
    ): Promise<void> {
        if (pairs.length === 0) {
            return;
        }

        const materialLevelMaterialWordRepository = manager.getRepository(
            MaterialLevelMaterialWord
        );

        const records = pairs.map((pair) => {
            const key = buildMaterialWordKey(
                pair.source_text,
                pair.target_text,
                pair.occurrence_indexes,
                languagePairId
            );

            const materialWordId = materialWordMap.get(key);

            if (!materialWordId) {
                throw new Error(
                    `materialWordId not found for pair: ${pair.source_text} -> ${pair.target_text}`
                );
            }

            return materialLevelMaterialWordRepository.create({
                materialWord: {
                    id: materialWordId,
                } as MaterialWord,
                materialLevel: {
                    id: materialLevelId,
                } as MaterialLevel,
            });
        });

        await materialLevelMaterialWordRepository.save(records);
    }
}
