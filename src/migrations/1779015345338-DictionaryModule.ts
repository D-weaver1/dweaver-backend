import { MigrationInterface, QueryRunner } from "typeorm";

export class DictionaryModule1779015345338 implements MigrationInterface {
    name = 'DictionaryModule1779015345338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dictionaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "language_pair_id" uuid, CONSTRAINT "PK_b864abffe7546b378d6ce4ba7c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dictionary_words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "added_at" TIMESTAMP NOT NULL DEFAULT now(), "dictionary_id" uuid, "word_id" uuid, CONSTRAINT "PK_e8207d01e9bf0399b5f18e6c180" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quiz_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "answer" text NOT NULL, "isCorrect" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "quiz_attempt_id" uuid NOT NULL, "question_id" uuid NOT NULL, CONSTRAINT "PK_3fefbc8a840a41b6a15a4f9ca5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quiz_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, "quiz_id" uuid NOT NULL, CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quizzes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dictionary_id" uuid NOT NULL, CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum" AS ENUM('s2t_translate', 't2s_translate', 's_synonym', 't_synonym')`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."questions_type_enum" NOT NULL, "text_template_id" uuid NOT NULL, "quiz_id" uuid NOT NULL, "dictionary_word_id" uuid, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."text_templates_questiontype_enum" AS ENUM('s2t_translate', 't2s_translate', 's_synonym', 't_synonym')`);
        await queryRunner.query(`CREATE TABLE "text_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionType" "public"."text_templates_questiontype_enum", CONSTRAINT "PK_b1136ed8584e48ffe0fdeac7f7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "language_text_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "template" text NOT NULL, "text_template_id" uuid NOT NULL, "language_id" uuid NOT NULL, CONSTRAINT "PK_9f62d6ace91a61a3d32a40d8925" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "dictionaries" ADD CONSTRAINT "FK_e8a11b0bb48ce367928c4ba0c23" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dictionaries" ADD CONSTRAINT "FK_3dfbbbb619b0a3ec631c3ba539e" FOREIGN KEY ("language_pair_id") REFERENCES "language_pairs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dictionary_words" ADD CONSTRAINT "FK_b9b2d88371dd8813b86fde48a31" FOREIGN KEY ("dictionary_id") REFERENCES "dictionaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dictionary_words" ADD CONSTRAINT "FK_d6bf759aa449cea6afa7b2cf4bc" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_eaf5ae4042926618ef0c8e3aa45" FOREIGN KEY ("quiz_attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" ADD CONSTRAINT "FK_fbe5e1758631924a83c73b521d9" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_attempts" ADD CONSTRAINT "FK_a720e260138b64fcff2fca19b2d" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quizzes" ADD CONSTRAINT "FK_55b48ae28f10c1ed066aa4552bf" FOREIGN KEY ("dictionary_id") REFERENCES "dictionaries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_8000d83651b08cedbec2d0211c8" FOREIGN KEY ("text_template_id") REFERENCES "text_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_46b3c125e02f7242662e4ccb307" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_b8b7dce84a6e510bfdc21cae996" FOREIGN KEY ("dictionary_word_id") REFERENCES "dictionary_words"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "language_text_templates" ADD CONSTRAINT "FK_447bf8fccfd683d5c1dcc6a5097" FOREIGN KEY ("text_template_id") REFERENCES "text_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "language_text_templates" ADD CONSTRAINT "FK_f5d91224aa1f7cc6622509483bc" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "language_text_templates" DROP CONSTRAINT "FK_f5d91224aa1f7cc6622509483bc"`);
        await queryRunner.query(`ALTER TABLE "language_text_templates" DROP CONSTRAINT "FK_447bf8fccfd683d5c1dcc6a5097"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_b8b7dce84a6e510bfdc21cae996"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_46b3c125e02f7242662e4ccb307"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_8000d83651b08cedbec2d0211c8"`);
        await queryRunner.query(`ALTER TABLE "quizzes" DROP CONSTRAINT "FK_55b48ae28f10c1ed066aa4552bf"`);
        await queryRunner.query(`ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_a720e260138b64fcff2fca19b2d"`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_fbe5e1758631924a83c73b521d9"`);
        await queryRunner.query(`ALTER TABLE "quiz_answers" DROP CONSTRAINT "FK_eaf5ae4042926618ef0c8e3aa45"`);
        await queryRunner.query(`ALTER TABLE "dictionary_words" DROP CONSTRAINT "FK_d6bf759aa449cea6afa7b2cf4bc"`);
        await queryRunner.query(`ALTER TABLE "dictionary_words" DROP CONSTRAINT "FK_b9b2d88371dd8813b86fde48a31"`);
        await queryRunner.query(`ALTER TABLE "dictionaries" DROP CONSTRAINT "FK_3dfbbbb619b0a3ec631c3ba539e"`);
        await queryRunner.query(`ALTER TABLE "dictionaries" DROP CONSTRAINT "FK_e8a11b0bb48ce367928c4ba0c23"`);
        await queryRunner.query(`DROP TABLE "language_text_templates"`);
        await queryRunner.query(`DROP TABLE "text_templates"`);
        await queryRunner.query(`DROP TYPE "public"."text_templates_questiontype_enum"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);
        await queryRunner.query(`DROP TABLE "quiz_attempts"`);
        await queryRunner.query(`DROP TABLE "quiz_answers"`);
        await queryRunner.query(`DROP TABLE "dictionary_words"`);
        await queryRunner.query(`DROP TABLE "dictionaries"`);
    }

}
