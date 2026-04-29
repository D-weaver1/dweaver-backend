const PUNCTUATION = new Set([".", ",", "!", "?", ":", ";"]);

/**
 * isPunctuation перевіряє, чи є значення знаком пунктуації.
 */

export function isPunctuation(value: string): boolean {
    return PUNCTUATION.has(value);
}
