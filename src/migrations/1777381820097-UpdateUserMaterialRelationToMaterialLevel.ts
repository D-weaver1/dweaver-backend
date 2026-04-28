import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserMaterialRelationToMaterialLevel1777381820097 implements MigrationInterface {
    name = 'UpdateUserMaterialRelationToMaterialLevel1777381820097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_material_level_status_enum" AS ENUM('not_started', 'in_progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "user_material_level" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."user_material_level_status_enum" NOT NULL DEFAULT 'not_started', "user_id" uuid NOT NULL, "material_level_id" uuid NOT NULL, CONSTRAINT "PK_007bef4fd9d09429fa2063880c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_material_level" ADD CONSTRAINT "FK_7e346edc736552592eab41e3d9a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_material_level" ADD CONSTRAINT "FK_42e74c76141d3b6f74ffa1bc7b8" FOREIGN KEY ("material_level_id") REFERENCES "material_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_material_level" DROP CONSTRAINT "FK_42e74c76141d3b6f74ffa1bc7b8"`);
        await queryRunner.query(`ALTER TABLE "user_material_level" DROP CONSTRAINT "FK_7e346edc736552592eab41e3d9a"`);
        await queryRunner.query(`DROP TABLE "user_material_level"`);
        await queryRunner.query(`DROP TYPE "public"."user_material_level_status_enum"`);
    }

}
