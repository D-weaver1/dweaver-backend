import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshToken1778424730447 implements MigrationInterface {
    name = 'AddRefreshToken1778424730447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7838d2ba25be1342091b6695f" ON "refresh_tokens" ("token_hash") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7838d2ba25be1342091b6695f"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
