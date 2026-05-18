import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiAnalysisJobProgress1779102535068 implements MigrationInterface {
    name = 'AddAiAnalysisJobProgress1779102535068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ADD "current_chunk_index" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ADD "total_chunks" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" ADD "chunks_json" jsonb`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" ADD "partial_result_json" jsonb`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" DROP COLUMN "partial_result_json"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_job_payloads" DROP COLUMN "chunks_json"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" DROP COLUMN "total_chunks"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" DROP COLUMN "current_chunk_index"`);
    }

}
