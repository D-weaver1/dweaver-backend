export enum UserRole {
    USER = "user",
    ADMIN = "admin",
}

export enum UserLanguagePairStatus {
    ACTIVE = "active",
    HIDDEN = "hidden",
}

export enum LanguageLevel {
    A1 = "A1",
    A2 = "A2",
    B1 = "B1",
    B2 = "B2",
    C1 = "C1",
    C2 = "C2",
}

export enum UserMaterialStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
}

export enum AiAnalysisJobStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    WAITING_RATE_LIMIT = "waiting_rate_limit",
    COMPLETED = "completed",
    FAILED = "failed",
}
