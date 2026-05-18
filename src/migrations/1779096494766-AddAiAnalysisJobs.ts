import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiAnalysisJobs1779096494766 implements MigrationInterface {
    name = 'AddAiAnalysisJobs1779096494766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ai_analysis_jobs_language_level_enum" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`);
        await queryRunner.query(`CREATE TYPE "public"."ai_analysis_jobs_status_enum" AS ENUM('pending', 'processing', 'waiting_rate_limit', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "ai_analysis_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "batch_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "language_level" "public"."ai_analysis_jobs_language_level_enum" NOT NULL, "status" "public"."ai_analysis_jobs_status_enum" NOT NULL DEFAULT 'pending', "error_message" text, "attempt_count" integer NOT NULL DEFAULT '0', "next_attempt_at" TIMESTAMP, "result_json" jsonb, "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "language_pair_id" uuid NOT NULL, CONSTRAINT "PK_ba2cf52a1373b9aaac740afdc86" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ai_analysis_job_payloads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "original_text" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "job_id" uuid NOT NULL, CONSTRAINT "REL_0b6a916f9d4ab1dd923670e136" UNIQUE ("job_id"), CONSTRAINT "PK_0103a3beee801a99d8091e56b06" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ADD CONSTRAINT "FK_6c8fd662e423f56995d78828ee6" FOREIGN KEY ("language_pair_id") REFERENCES "language_pairs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" ADD CONSTRAINT "FK_0b6a916f9d4ab1dd923670e1366" FOREIGN KEY ("job_id") REFERENCES "ai_analysis_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" DROP CONSTRAINT "FK_0b6a916f9d4ab1dd923670e1366"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" DROP CONSTRAINT "FK_6c8fd662e423f56995d78828ee6"`);
        await queryRunner.query(`DROP TABLE "ai_analysis_job_payloads"`);
        await queryRunner.query(`DROP TABLE "ai_analysis_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."ai_analysis_jobs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ai_analysis_jobs_language_level_enum"`);
    }

}
