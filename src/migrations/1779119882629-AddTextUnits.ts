import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTextUnits1779119882629 implements MigrationInterface {
    name = 'AddTextUnits1779119882629'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "materials" ADD "text_units" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "materials" DROP COLUMN "text_units"`);
    }
}
