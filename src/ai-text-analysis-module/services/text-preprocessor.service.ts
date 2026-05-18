export class TextPreprocessorService {
    preprocess(text: string): string {
        let result = text.trim();

        result = this.normalizeLineBreaks(result);
        result = this.removeExtraSpaces(result);
        result = this.normalizePunctuationSpacing(result);
        result = this.normalizeQuotesAndDashes(result);

        return result;
    }

    private normalizeLineBreaks(text: string): string {
        return text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n{3,}/g, "\n\n");
    }

    private removeExtraSpaces(text: string): string {
        return text
            .split("\n")
            .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
            .join("\n");
    }

    private normalizePunctuationSpacing(text: string): string {
        return text
            .replace(/\s+([.,!?;:])/g, "$1")
            .replace(/([.,!?;:])([^\s\n])/g, "$1 $2");
    }

    private normalizeQuotesAndDashes(text: string): string {
        return text
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/–|—/g, "-");
    }
}