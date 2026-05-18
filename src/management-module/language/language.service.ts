import { Language } from "../../entities";
import { CreateLanguageDto } from "./dto/create-language.dto";
import { LanguageRepository } from "./repositories/language.repository";

export class LanguageService {
    constructor(private readonly languageRepository: LanguageRepository) {}

    async getAll(): Promise<Language[]> {
        return this.languageRepository.findAll();
    }

    async create(dto: CreateLanguageDto): Promise<Language> {
        const name = dto.name?.trim();
        const code = dto.code?.trim().toLowerCase();

        if (!name) {
            throw new Error("Language name is required");
        }

        if (!code) {
            throw new Error("Language code is required");
        }

        const existingByName = await this.languageRepository.findByName(name);

        if (existingByName) {
            throw new Error(`Language with name "${name}" already exists`);
        }

        const existingByCode = await this.languageRepository.findByCode(code);

        if (existingByCode) {
            throw new Error(`Language with code "${code}" already exists`);
        }

        return this.languageRepository.create({
            name,
            code,
        });
    }
}