import { env } from "../../env";

export type TextChunk = {
    index: number;
    text: string;
    estimatedTokens: number;
};

export class TextChunkerService {
    split(text: string): TextChunk[] {
        const maxTokens = env.AI_CHUNK_MAX_ESTIMATED_TOKENS;
        const maxChars = maxTokens * 4;

        const chunks: string[] = [];

        const paragraphs = text
            .split(/\n{1,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

        let currentChunk = "";

        const flushCurrentChunk = () => {
            if (!currentChunk.trim()) {
                return;
            }

            chunks.push(currentChunk.trim());
            currentChunk = "";
        };

        for (const paragraph of paragraphs) {
            if (this.estimateTokens(paragraph) > maxTokens) {
                flushCurrentChunk();

                const sentenceChunks = this.splitLargeTextBySentences(
                    paragraph,
                    maxChars
                );

                chunks.push(...sentenceChunks);
                continue;
            }

            const candidate = currentChunk
                ? `${currentChunk}\n\n${paragraph}`
                : paragraph;

            if (this.estimateTokens(candidate) <= maxTokens) {
                currentChunk = candidate;
                continue;
            }

            flushCurrentChunk();
            currentChunk = paragraph;
        }

        flushCurrentChunk();

        if (chunks.length === 0 && text.trim()) {
            chunks.push(text.trim());
        }

        return chunks.map((chunk, index) => ({
            index,
            text: chunk,
            estimatedTokens: this.estimateTokens(chunk),
        }));
    }

    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    private splitLargeTextBySentences(
        text: string,
        maxChars: number
    ): string[] {
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);

        const chunks: string[] = [];
        let currentChunk = "";

        for (const sentence of sentences) {
            if (sentence.length > maxChars) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }

                chunks.push(...this.splitTooLongSentence(sentence, maxChars));
                continue;
            }

            const candidate = currentChunk
                ? `${currentChunk} ${sentence}`
                : sentence;

            if (candidate.length <= maxChars) {
                currentChunk = candidate;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }

                currentChunk = sentence;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private splitTooLongSentence(sentence: string, maxChars: number): string[] {
        const words = sentence.split(/\s+/).filter(Boolean);
        const chunks: string[] = [];

        let currentChunk = "";

        for (const word of words) {
            const candidate = currentChunk ? `${currentChunk} ${word}` : word;

            if (candidate.length <= maxChars) {
                currentChunk = candidate;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }

                currentChunk = word;
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }
}