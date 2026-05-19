import { DataSource, In } from "typeorm";
import {
    Material,
    MaterialLevel,
    MaterialLevelMaterialWord,
    UserMaterialLevel,
} from "../../../entities";
import { UserMaterialStatus } from "../../../entities/enums";

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

    async findUserMaterialLevel(
        userId: string,
        levelId: string
    ): Promise<UserMaterialLevel | null> {
        const userMaterialLevelRepository =
            this.dataSource.getRepository(UserMaterialLevel);

        return userMaterialLevelRepository.findOne({
            where: {
                user: {
                    id: userId,
                },
                materialLevel: {
                    id: levelId,
                },
            },
            relations: {
                materialLevel: true,
            },
        });
    }
    async findUserMaterialLevelsByLevelIds(
        userId: string,
        levelIds: string[]
    ): Promise<UserMaterialLevel[]> {
        if (levelIds.length === 0) {
            return [];
        }

        const userMaterialLevelRepository =
            this.dataSource.getRepository(UserMaterialLevel);

        return userMaterialLevelRepository.find({
            where: {
                user: {
                    id: userId,
                },
                materialLevel: {
                    id: In(levelIds),
                },
            },
            relations: {
                materialLevel: true,
            },
        });
    }

    async saveUserMaterialLevel(
        userId: string,
        levelId: string,
        status: UserMaterialStatus
    ): Promise<UserMaterialLevel> {
        const userMaterialLevelRepository =
            this.dataSource.getRepository(UserMaterialLevel);

        const existing = await this.findUserMaterialLevel(userId, levelId);

        if (existing) {
            existing.status = status;

            return userMaterialLevelRepository.save(existing);
        }

        const progress = userMaterialLevelRepository.create({
            status,
            user: {
                id: userId,
            },
            materialLevel: {
                id: levelId,
            },
        });

        return userMaterialLevelRepository.save(progress);
    }

    async getMaterialsProgressSummary(userId: string, materialIds?: string[]) {
        const materialLevelRepository =
            this.dataSource.getRepository(MaterialLevel);

        const levels = await materialLevelRepository.find({
            where:
                materialIds && materialIds.length > 0
                    ? {
                          material: {
                              id: In(materialIds),
                          },
                      }
                    : {},
            relations: {
                material: true,
            },
        });

        const levelIds = levels.map((level) => level.id);

        const userProgresses = await this.findUserMaterialLevelsByLevelIds(
            userId,
            levelIds
        );

        const progressByLevelId = new Map<string, UserMaterialStatus>();

        for (const progress of userProgresses) {
            progressByLevelId.set(progress.materialLevel.id, progress.status);
        }

        const summaryByMaterialId = new Map<
            string,
            {
                completedLevelsCount: number;
                totalLevelsCount: number;
                hasInProgress: boolean;
            }
        >();

        for (const level of levels) {
            const materialId = level.material.id;

            const current = summaryByMaterialId.get(materialId) ?? {
                completedLevelsCount: 0,
                totalLevelsCount: 0,
                hasInProgress: false,
            };

            current.totalLevelsCount += 1;

            const status =
                progressByLevelId.get(level.id) ??
                UserMaterialStatus.NOT_STARTED;

            if (status === UserMaterialStatus.COMPLETED) {
                current.completedLevelsCount += 1;
            }

            if (status === UserMaterialStatus.IN_PROGRESS) {
                current.hasInProgress = true;
            }

            summaryByMaterialId.set(materialId, current);
        }

        return Array.from(summaryByMaterialId.entries()).map(
            ([materialId, summary]) => {
                let status = UserMaterialStatus.NOT_STARTED;

                if (
                    summary.totalLevelsCount > 0 &&
                    summary.completedLevelsCount === summary.totalLevelsCount
                ) {
                    status = UserMaterialStatus.COMPLETED;
                } else if (
                    summary.completedLevelsCount > 0 ||
                    summary.hasInProgress
                ) {
                    status = UserMaterialStatus.IN_PROGRESS;
                }

                return {
                    materialId,
                    completedLevelsCount: summary.completedLevelsCount,
                    totalLevelsCount: summary.totalLevelsCount,
                    status,
                };
            }
        );
    }
}
