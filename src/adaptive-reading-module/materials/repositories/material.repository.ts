import { EntityManager } from "typeorm";

export type MaterialLanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

type FindMaterialsParams = {
    languagePairId: string;
    search?: string;
    languageLevels: MaterialLanguageLevel[];
};

type MaterialRow = {
    id: string;
    title: string;
    languageLevel: MaterialLanguageLevel;
    text: string;
};

export class MaterialRepository {
    async findMaterials(manager: EntityManager, params: FindMaterialsParams) {
        const values: unknown[] = [params.languagePairId];

        let whereSql = `
            WHERE material.language_pair_id = $1
        `;

        if (params.languageLevels.length > 0) {
            values.push(params.languageLevels);

            whereSql += `
                AND material.language_level::text = ANY($${values.length}::text[])
            `;
        }

        if (params.search) {
            values.push(`%${params.search}%`);

            whereSql += `
                AND (
                    material.title ILIKE $${values.length}
                    OR material.text ILIKE $${values.length}
                )
            `;
        }

        const materials = await manager.query<MaterialRow[]>(
            `
                SELECT
                    material.id,
                    material.title,
                    material.language_level AS "languageLevel",
                    material.text
                FROM materials AS material
                ${whereSql}
                ORDER BY
                    CASE material.language_level::text
                        WHEN 'A1' THEN 1
                        WHEN 'A2' THEN 2
                        WHEN 'B1' THEN 3
                        WHEN 'B2' THEN 4
                        WHEN 'C1' THEN 5
                        WHEN 'C2' THEN 6
                        ELSE 7
                    END,
                    material.title ASC
            `,
            values
        );

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
