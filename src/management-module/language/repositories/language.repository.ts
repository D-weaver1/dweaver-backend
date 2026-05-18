import { Repository } from "typeorm";
import db from "../../../data-source";
import { Language } from "../../../entities";
import { CreateLanguageDto } from "../dto/create-language.dto";

export class LanguageRepository {
    private readonly repository: Repository<Language>;

    constructor() {
        this.repository = db.getRepository(Language);
    }

    async findAll(): Promise<Language[]> {
        return this.repository.find({
            order: {
                name: "ASC",
            },
        });
    }

    async findById(id: string): Promise<Language | null> {
        return this.repository.findOne({
            where: {
                id,
            },
        });
    }

    async findByName(name: string): Promise<Language | null> {
        return this.repository.findOne({
            where: {
                name,
            },
        });
    }

    async findByCode(code: string): Promise<Language | null> {
        return this.repository.findOne({
            where: {
                code,
            },
        });
    }

    async create(input: CreateLanguageDto): Promise<Language> {
        const language = this.repository.create({
            name: input.name,
            code: input.code,
        });

        return this.repository.save(language);
    }
}