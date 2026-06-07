import { MigrationInterface, QueryRunner } from "typeorm";

export class QuizFix1780838623927 implements MigrationInterface {
    name = 'QuizFix1780838623927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_material_level" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" RENAME TO "questions_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum" AS ENUM('s2t_translate', 't2s_translate', 's2t_input')`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "type" TYPE "public"."questions_type_enum" USING "type"::"text"::"public"."questions_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."text_templates_questiontype_enum" RENAME TO "text_templates_questiontype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."text_templates_questiontype_enum" AS ENUM('s2t_translate', 't2s_translate', 's2t_input')`);
        await queryRunner.query(`ALTER TABLE "text_templates" ALTER COLUMN "questionType" TYPE "public"."text_templates_questiontype_enum" USING "questionType"::"text"::"public"."text_templates_questiontype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."text_templates_questiontype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."text_templates_questiontype_enum_old" AS ENUM('s2t_translate', 't2s_translate', 's_synonym', 't_synonym')`);
        await queryRunner.query(`ALTER TABLE "text_templates" ALTER COLUMN "questionType" TYPE "public"."text_templates_questiontype_enum_old" USING "questionType"::"text"::"public"."text_templates_questiontype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."text_templates_questiontype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."text_templates_questiontype_enum_old" RENAME TO "text_templates_questiontype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum_old" AS ENUM('s2t_translate', 't2s_translate', 's_synonym', 't_synonym')`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "type" TYPE "public"."questions_type_enum_old" USING "type"::"text"::"public"."questions_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum_old" RENAME TO "questions_type_enum"`);
        await queryRunner.query(`ALTER TABLE "user_material_level" DROP COLUMN "updated_at"`);
    }

}
