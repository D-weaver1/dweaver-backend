import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizTitle1780512787148 implements MigrationInterface {
    name = 'AddQuizTitle1780512787148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quizzes" ADD "title" text`);
        await queryRunner.query(`ALTER TABLE "materials" ALTER COLUMN "text_units" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "materials" ALTER COLUMN "text_units" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "title"`);
    }

}
