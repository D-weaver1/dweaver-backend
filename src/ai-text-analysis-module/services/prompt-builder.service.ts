export class PromptBuilderService {
    build(params: {
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        originalText: string;
    }): string {
        return [
            "Return only valid JSON.",
            "Do not use markdown.",
            "Do not add explanations.",
            "",
            "Required JSON structure:",
            "{",
            '  "title": string,',
            '  "source_language": string,',
            '  "target_language": string,',
            '  "original_text": string,',
            '  "text_units": string[],',
            '  "pairs": [',
            "    {",
            '      "source_text": string,',
            '      "target_text": string,',
            '      "occurrence_indexes": number[]',
            "    }",
            "  ]",
            "}",
            "",
            "Rules for text_units:",
            "- text_units must be in reading order.",
            "- text_units should usually be single words, punctuation marks, or short lexical phrases.",
            "- punctuation may be separate units.",
            "- do not merge the whole sentence into one text unit.",
            "",
            "Rules for pairs:",
            "- pairs must represent lexical translation units, not whole sentences.",
            "- source_text must not be a full sentence or a long clause.",
            "- target_text must never be empty.",
            "- if an article, auxiliary verb, or function word is hard to translate alone, combine it into a short phrase with a neighboring word.",
            "- occurrence_indexes must point to indexes inside text_units.",
            "- if the same lexical unit appears multiple times, include all its indexes.",
            "",
            "Good example:",
            "{",
            '  "title": "A Dog Story",',
            '  "source_language": "en",',
            '  "target_language": "uk",',
            '  "original_text": "I see a dog. I like the dog.",',
            '  "text_units": ["I", "see", "a dog", ".", "I", "like", "the dog", "."],',
            '  "pairs": [',
            '    { "source_text": "I", "target_text": "Я", "occurrence_indexes": [0, 4] },',
            '    { "source_text": "see", "target_text": "бачу", "occurrence_indexes": [1] },',
            '    { "source_text": "a dog", "target_text": "собаку", "occurrence_indexes": [2] },',
            '    { "source_text": ".", "target_text": ".", "occurrence_indexes": [3, 7] },',
            '    { "source_text": "like", "target_text": "люблю", "occurrence_indexes": [5] },',
            '    { "source_text": "the dog", "target_text": "собаку", "occurrence_indexes": [6] }',
            "  ]",
            "}",
            "",
            `Title: ${params.title}`,
            `Source language: ${params.sourceLanguage}`,
            `Target language: ${params.targetLanguage}`,
            `Original text: ${params.originalText}`,
        ].join("\n");
    }

    buildRetryPrompt(params: {
        previousPrompt: string;
        validationError: string;
    }): string {
        return [
            params.previousPrompt,
            "",
            "Your previous response was invalid.",
            `Validation error: ${params.validationError}`,
            "",
            "Fix the response.",
            "Do not return sentence-level translation pairs.",
            "Do not return empty target_text.",
            "If a lexical unit appears multiple times, include all indexes in occurrence_indexes.",
            "Return only corrected valid JSON.",
        ].join("\n");
    }
}
