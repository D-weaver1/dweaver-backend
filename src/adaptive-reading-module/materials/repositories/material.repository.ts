import { EntityManager } from "typeorm";
import { Material } from "../../../entities";

type FindMaterialsParams = {
    languagePairId: string;
    search?: string;
    languageLevels: string[];
};

export class MaterialRepository {
    async findMaterials(manager: EntityManager, params: FindMaterialsParams) {
        const queryBuilder = manager
            .getRepository(Material)
            .createQueryBuilder("material")
            .where("material.language_pair_id = :languagePairId", {
                languagePairId: params.languagePairId,
            })
            .orderBy("material.language_level", "ASC")
            .addOrderBy("material.title", "ASC");

        if (params.languageLevels.length > 0) {
            queryBuilder.andWhere(
                "material.language_level IN (:...languageLevels)",
                {
                    languageLevels: params.languageLevels,
                }
            );
        }

        if (params.search) {
            queryBuilder.andWhere(
                "(material.title ILIKE :search OR material.text ILIKE :search)",
                {
                    search: `%${params.search}%`,
                }
            );
        }

        const materials = await queryBuilder.getMany();

        return materials.map((material) => ({
            id: material.id,
            title: material.title,
            languageLevel: material.languageLevel,
            preview: this.createPreview(material.text),
        }));
    }

    private createPreview(text: string): string {
        const normalizedText = text.trim();

        if (normalizedText.length <= 160) {
            return normalizedText;
        }

        return `${normalizedText.slice(0, 160)}...`;
    }
}
