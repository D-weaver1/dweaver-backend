const PUNCTUATION = new Set([
    ".",
    ",",
    "!",
    "?",
    ":",
    ";",
    "…",
    "—",
    "(",
    ")",
    "«",
    "»",
]);

const NO_SPACE_BEFORE = new Set([".", ",", "!", "?", ":", ";", "…", ")", "»"]);

const NO_SPACE_AFTER = new Set(["(", "«"]);

export function isPunctuation(value: string): boolean {
    return PUNCTUATION.has(value);
}

export function shouldAttachToPrevious(value: string): boolean {
    return NO_SPACE_BEFORE.has(value);
}

export function shouldAttachNextToPrevious(value: string): boolean {
    return NO_SPACE_AFTER.has(value);
}
