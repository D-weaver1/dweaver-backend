export class PromptBuilderService {
    build(params: {
        title: string;
        sourceLanguage: string;
        targetLanguage: string;
        languageLevel: string;
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
            "- text_units should usually be single words or short lexical phrases.",
            "- do not merge the whole sentence into one text unit.",
            "- preserve punctuation as separate text_units when possible.",
            '- punctuation units include ".", ",", "!", "?", ":", ";", "…", "—", "(", ")", "«", "»".',
            "- preserve paragraph breaks from the original text.",
            '- if there is a paragraph break in the original text, add "\\n\\n" as a separate item in text_units.',
            '- "\\n\\n" must be used only as a structural paragraph break unit.',
            "",
            "Rules for pairs:",
            "- pairs must represent only lexical translation units.",
            "- do not create translation pairs for punctuation.",
            '- do not create translation pairs for "\\n\\n".',
            "- source_text must not be a full sentence or a long clause.",
            "- target_text must never be empty.",
            "- if an article, auxiliary verb, or function word is hard to translate alone, combine it into a short phrase with a neighboring word.",
            "- occurrence_indexes must point to indexes inside text_units.",
            "- occurrence_indexes must point only to lexical units.",
            "- occurrence_indexes must not point to punctuation units.",
            '- occurrence_indexes must not point to "\\n\\n" paragraph break units.',
            "- if the same lexical unit appears multiple times, include all its indexes.",
            "",
            "Rules for translation difficulty:",
            `- Target language learning level is ${params.languageLevel}.`,
            "- Adapt target_text to this level when possible.",
            "- For A1-A2, prefer simple, common and easy-to-understand translations.",
            "- For B1-B2, use natural everyday translations with moderate vocabulary.",
            "- For C1-C2, use more precise and advanced translations when appropriate.",
            "- Do not simplify source_text or text_units. Only adapt target_text.",
            "- Keep target_text concise because it will be inserted into adaptive reading text.",
            "",
            "Good example:",
            "{",
            '  "title": "A Dog Story",',
            '  "source_language": "en",',
            '  "target_language": "uk",',
            '  "original_text": "I see a dog.\\n\\nI like the dog!",',
            '  "text_units": ["I", "see", "a dog", ".", "\\n\\n", "I", "like", "the dog", "!"],',
            '  "pairs": [',
            '    { "source_text": "I", "target_text": "Я", "occurrence_indexes": [0, 5] },',
            '    { "source_text": "see", "target_text": "бачу", "occurrence_indexes": [1] },',
            '    { "source_text": "a dog", "target_text": "собаку", "occurrence_indexes": [2] },',
            '    { "source_text": "like", "target_text": "люблю", "occurrence_indexes": [6] },',
            '    { "source_text": "the dog", "target_text": "собаку", "occurrence_indexes": [7] }',
            "  ]",
            "}",
            "",
            `Title: ${params.title}`,
            `Source language: ${params.sourceLanguage}`,
            `Target language: ${params.targetLanguage}`,
            `Target language learning level: ${params.languageLevel}`,
            `Original text: ${params.originalText}`,
        ].join("\n");
    }

    buildRetryPrompt(params: {
        originalPrompt: string;
        validationError: string;
        previousResponse: string;
    }): string {
        return [
            params.originalPrompt,
            "",
            "Your previous response was invalid.",
            `Detected validation error: ${params.validationError}`,
            "",
            "Previous invalid response:",
            this.truncateForRetryPrompt(params.previousResponse),
            "",
            "Fix the full JSON response.",
            "The detected error may be only the first validation error.",
            "Carefully check the whole response, especially the place mentioned in the error and all items after it.",
            "Check that every pair.source_text exactly matches all text_units at its occurrence_indexes.",
            "Check that punctuation and paragraph breaks are present in text_units but absent from pairs.",
            "Do not create translation pairs for punctuation.",
            'Do not create translation pairs for "\\n\\n".',
            "Do not use punctuation indexes in occurrence_indexes.",
            'Do not use "\\n\\n" indexes in occurrence_indexes.',
            "Return the complete corrected JSON, not only the changed fragment.",
            "Return only valid JSON.",
        ].join("\n");
    }

    private truncateForRetryPrompt(value: string): string {
        const maxLength = 12000;

        if (value.length <= maxLength) {
            return value;
        }

        return `${value.slice(0, maxLength)}\n[TRUNCATED]`;
    }
}
