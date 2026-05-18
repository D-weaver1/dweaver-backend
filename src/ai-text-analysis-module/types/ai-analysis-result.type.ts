export type AiPair = {
    source_text: string;
    target_text: string;
    occurrence_indexes: number[];
};

export type AiAnalysisResult = {
    title: string;
    source_language: string;
    target_language: string;
    original_text: string;
    text_units: string[];
    pairs: AiPair[];
};
