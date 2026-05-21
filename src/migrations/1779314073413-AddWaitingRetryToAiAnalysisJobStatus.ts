import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWaitingRetryToAiAnalysisJobStatus1779314073413 implements MigrationInterface {
    name = 'AddWaitingRetryToAiAnalysisJobStatus1779314073413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "materials" ALTER COLUMN "text_units" SET DEFAULT '[]'::jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."ai_analysis_jobs_status_enum" RENAME TO "ai_analysis_jobs_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ai_analysis_jobs_status_enum" AS ENUM('pending', 'processing', 'waiting_rate_limit', 'waiting_retry', 'completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" TYPE "public"."ai_analysis_jobs_status_enum" USING "status"::"text"::"public"."ai_analysis_jobs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."ai_analysis_jobs_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ai_analysis_jobs_status_enum_old" AS ENUM('pending', 'processing', 'waiting_rate_limit', 'completed', 'failed')`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" TYPE "public"."ai_analysis_jobs_status_enum_old" USING "status"::"text"::"public"."ai_analysis_jobs_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ai_analysis_jobs" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."ai_analysis_jobs_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ai_analysis_jobs_status_enum_old" RENAME TO "ai_analysis_jobs_status_enum"`);
        await queryRunner.query(`ALTER TABLE "materials" ALTER COLUMN "text_units" SET DEFAULT '[]'`);
    }

}
