import { AiAnalysisResult, AiPair } from "../types/ai-analysis-result.type";

export class AnalysisResultMergerService {
    createBaseResult(params: {
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        originalText: string;
    }): AiAnalysisResult {
        return {
            title: params.title,
            source_language: params.sourceLanguage,
            target_language: params.targetLanguage,
            original_text: params.originalText,
            text_units: [],
            pairs: [],
        };
    }

    mergeChunk(
        target: AiAnalysisResult,
        chunkResult: AiAnalysisResult
    ): AiAnalysisResult {
        const offset = target.text_units.length;

        target.text_units.push(...chunkResult.text_units);

        const pairMap = new Map<string, AiPair>();

        for (const pair of target.pairs) {
            pairMap.set(this.buildPairKey(pair), pair);
        }

        for (const pair of chunkResult.pairs) {
            const shiftedIndexes = pair.occurrence_indexes.map(
                (index) => index + offset
            );

            const key = this.buildPairKey(pair);
            const existingPair = pairMap.get(key);

            if (existingPair) {
                existingPair.occurrence_indexes = this.mergeIndexes(
                    existingPair.occurrence_indexes,
                    shiftedIndexes
                );
            } else {
                const newPair: AiPair = {
                    source_text: pair.source_text,
                    target_text: pair.target_text,
                    occurrence_indexes: shiftedIndexes,
                };

                target.pairs.push(newPair);
                pairMap.set(key, newPair);
            }
        }

        return target;
    }

    private buildPairKey(pair: Pick<AiPair, "source_text" | "target_text">) {
        return JSON.stringify([pair.source_text, pair.target_text]);
    }

    private mergeIndexes(
        existingIndexes: number[],
        newIndexes: number[]
    ): number[] {
        return [...new Set([...existingIndexes, ...newIndexes])].sort(
            (a, b) => a - b
        );
    }
}
