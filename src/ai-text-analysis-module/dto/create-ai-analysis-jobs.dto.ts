import { LanguageLevel } from "../../entities";

export type CreateAiAnalysisJobsDto = {
    title: string;
    language_level: LanguageLevel;
    source_language: string;
    target_languages: string[];
    original_text: string;
};
