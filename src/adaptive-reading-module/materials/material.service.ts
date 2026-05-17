import { DataSource } from "typeorm";
import { GetMaterialsQueryDto } from "./dto/get-materials-query.dto";
import { MaterialRepository } from "./repositories/material.repository";
import { UserLanguagePairRepository } from "./repositories/user-language-pair.repository";

const MATERIAL_LEVEL_GROUPS: Record<string, string[]> = {
    A0: ["A0"],
    "A1-A2": ["A1", "A2"],
    "B1-B2": ["B1", "B2"],
    "C1-C2": ["C1", "C2"],
};

export class MaterialService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly userLanguagePairRepository: UserLanguagePairRepository,
        private readonly materialRepository: MaterialRepository
    ) {}

    async getMaterials(userId: string, dto: GetMaterialsQueryDto) {
        const search = this.prepareSearch(dto.search);
        const selectedLevelGroups = this.prepareLevelGroups(dto.levels);
        const languageLevels =
            this.getLanguageLevelsFromGroups(selectedLevelGroups);

        const languagePairId =
            await this.userLanguagePairRepository.findCurrentLanguagePairId(
                this.dataSource.manager,
                userId
            );

        const materials = await this.materialRepository.findMaterials(
            this.dataSource.manager,
            {
                languagePairId,
                search,
                languageLevels,
            }
        );

        return {
            languagePairId,
            filters: {
                search,
                selectedLevelGroups,
                languageLevels,
            },
            materials,
        };
    }

    private prepareSearch(search?: string): string | undefined {
        if (!search) {
            return undefined;
        }

        const trimmedSearch = search.trim();

        return trimmedSearch.length > 0 ? trimmedSearch : undefined;
    }

    private prepareLevelGroups(levels?: string | string[]): string[] {
        if (!levels) {
            return [];
        }

        const rawLevels = Array.isArray(levels) ? levels : [levels];

        const levelGroups = rawLevels
            .flatMap((level) => level.split(","))
            .map((level) => level.trim())
            .filter(Boolean);

        for (const levelGroup of levelGroups) {
            if (!MATERIAL_LEVEL_GROUPS[levelGroup]) {
                throw new Error(`Invalid material level filter: ${levelGroup}`);
            }
        }

        return levelGroups;
    }

    private getLanguageLevelsFromGroups(levelGroups: string[]): string[] {
        const languageLevels = new Set<string>();

        for (const levelGroup of levelGroups) {
            const levels = MATERIAL_LEVEL_GROUPS[levelGroup];

            for (const level of levels) {
                languageLevels.add(level);
            }
        }

        return Array.from(languageLevels);
    }
}
