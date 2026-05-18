import { DataSource } from "typeorm";
import {
    Material,
    MaterialLevel,
    MaterialLevelMaterialWord,
} from "../../../entities";

export class MaterialLevelRepository {
    constructor(private readonly dataSource: DataSource) {}

    async findLevelsByMaterialId(materialId: string): Promise<MaterialLevel[]> {
        const materialLevelRepository =
            this.dataSource.getRepository(MaterialLevel);

        return materialLevelRepository.find({
            where: {
                material: {
                    id: materialId,
                },
            },
            order: {
                factor: "ASC",
            },
        });
    }

    async findMaterialById(materialId: string): Promise<Material | null> {
        const materialRepository = this.dataSource.getRepository(Material);

        return materialRepository.findOne({
            where: {
                id: materialId,
            },
        });
    }

    async findLevelByMaterialId(
        materialId: string,
        levelId: string
    ): Promise<MaterialLevel | null> {
        const materialLevelRepository =
            this.dataSource.getRepository(MaterialLevel);

        return materialLevelRepository.findOne({
            where: {
                id: levelId,
                material: {
                    id: materialId,
                },
            },
        });
    }

    async findLevelWords(
        levelId: string
    ): Promise<MaterialLevelMaterialWord[]> {
        const materialLevelMaterialWordRepository =
            this.dataSource.getRepository(MaterialLevelMaterialWord);

        return materialLevelMaterialWordRepository.find({
            where: {
                materialLevel: {
                    id: levelId,
                },
            },
            relations: {
                materialWord: {
                    word: true,
                },
            },
        });
    }
}
