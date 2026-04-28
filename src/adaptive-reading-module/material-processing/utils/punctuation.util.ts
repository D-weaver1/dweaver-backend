const PUNCTUATION = new Set([".", ",", "!", "?", ":", ";"]);

export function isPunctuation(value: string): boolean {
    return PUNCTUATION.has(value);
}
