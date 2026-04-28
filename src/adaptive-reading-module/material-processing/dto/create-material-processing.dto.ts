import { Pair } from "../types/pair.type";

export type CreateMaterialProcessingDto = {
    title: string;
    language_level: string;

    source_language: string;
    target_language: string;

    original_text: string;
    text_units: string[];
    pairs: Pair[];
};
