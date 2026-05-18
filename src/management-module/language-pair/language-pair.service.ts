import { LanguagePair } from "../../entities";
import { CreateLanguagePairDto } from "./dto/create-language-pair.dto";
import { LanguagePairRepository } from "./repositories/language-pair.repository";

export class LanguagePairService {
    constructor(
        private readonly languagePairRepository: LanguagePairRepository
    ) {}

    async getAll(): Promise<LanguagePair[]> {
        return this.languagePairRepository.findAll();
    }

    async create(dto: CreateLanguagePairDto): Promise<LanguagePair> {
        const sourceLanguageId = dto.sourceLanguageId?.trim();
        const targetLanguageId = dto.targetLanguageId?.trim();

        if (!sourceLanguageId) {
            throw new Error("Source language id is required");
        }

        if (!targetLanguageId) {
            throw new Error("Target language id is required");
        }

        if (sourceLanguageId === targetLanguageId) {
            throw new Error(
                "Source language and target language must be different"
            );
        }

        const sourceLanguage =
            await this.languagePairRepository.findLanguageById(sourceLanguageId);

        if (!sourceLanguage) {
            throw new Error("Source language not found");
        }

        const targetLanguage =
            await this.languagePairRepository.findLanguageById(targetLanguageId);

        if (!targetLanguage) {
            throw new Error("Target language not found");
        }

        const existingPair =
            await this.languagePairRepository.findExistingPair(
                sourceLanguageId,
                targetLanguageId
            );

        if (existingPair) {
            throw new Error("Language pair already exists");
        }

        return this.languagePairRepository.create(
            sourceLanguage,
            targetLanguage
        );
    }
}