import { MigrationInterface, QueryRunner } from "typeorm";

export class DbInitial1775913493579 implements MigrationInterface {
    name = 'DbInitial1775913493579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "languages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, CONSTRAINT "UQ_9c0e155475f0aa782e4a6178969" UNIQUE ("name"), CONSTRAINT "UQ_7397752718d1c9eb873722ec9b2" UNIQUE ("code"), CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "language_pairs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_language_id" uuid, "target_language_id" uuid, CONSTRAINT "UQ_2de628ce8a556da298d3004241e" UNIQUE ("source_language_id", "target_language_id"), CONSTRAINT "PK_0e12b21a738613291becf144440" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_language_pairs_status_enum" AS ENUM('active', 'hidden')`);
        await queryRunner.query(`CREATE TABLE "user_language_pairs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."user_language_pairs_status_enum" NOT NULL DEFAULT 'active', "last_used" TIMESTAMP, "user_id" uuid NOT NULL, "language_pair_id" uuid NOT NULL, CONSTRAINT "UQ_f961f79a3aa723216e19c6f58cb" UNIQUE ("user_id", "language_pair_id"), CONSTRAINT "PK_1bbec470009fea680454bf5abd4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."materials_language_level_enum" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2')`);
        await queryRunner.query(`CREATE TABLE "materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "language_level" "public"."materials_language_level_enum" NOT NULL, "text" text NOT NULL, "language_pair_id" uuid NOT NULL, CONSTRAINT "PK_2fd1a93ecb222a28bef28663fa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_materials_status_enum" AS ENUM('not_started', 'in_progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "user_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."user_materials_status_enum" NOT NULL DEFAULT 'not_started', "user_id" uuid NOT NULL, "material_id" uuid NOT NULL, CONSTRAINT "UQ_bf790abbdd156f23e40e1fc87de" UNIQUE ("user_id", "material_id"), CONSTRAINT "PK_524f8b50abdd23dd75da1fc8072" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_text" character varying(255) NOT NULL, "translation" character varying(255) NOT NULL, "language_pair_id" uuid NOT NULL, CONSTRAINT "UQ_e533b233d7c3de7c9eda3f713c5" UNIQUE ("source_text", "translation", "language_pair_id"), CONSTRAINT "PK_feaf97accb69a7f355fa6f58a3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "material_words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "indexes" jsonb NOT NULL, "word_id" uuid NOT NULL, "material_id" uuid NOT NULL, CONSTRAINT "UQ_7b2b00e6b4c99a398940f8647cf" UNIQUE ("word_id", "material_id"), CONSTRAINT "PK_7b4551345101dd10ca849706181" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "material_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "factor" integer NOT NULL, "text" text NOT NULL, "material_id" uuid NOT NULL, CONSTRAINT "UQ_b388d2c004dd7fc3583efecbf7c" UNIQUE ("material_id", "factor"), CONSTRAINT "PK_1b7997fe873da15b6b93f08219f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "material_level_material_words" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "material_word_id" uuid NOT NULL, "material_level_id" uuid NOT NULL, CONSTRAINT "UQ_ca5e288b1819aae9d9880cedd54" UNIQUE ("material_word_id", "material_level_id"), CONSTRAINT "PK_07488abaf46c9c659e089d066e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "language_pairs" ADD CONSTRAINT "FK_f939c2d41b7805edc32f6690f6c" FOREIGN KEY ("source_language_id") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "language_pairs" ADD CONSTRAINT "FK_2e128a16395a26e9819b7fbc71d" FOREIGN KEY ("target_language_id") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_language_pairs" ADD CONSTRAINT "FK_9011fba8f7afca66b69aba2b05c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_language_pairs" ADD CONSTRAINT "FK_eacf9afa1ad6bef655db6f559e3" FOREIGN KEY ("language_pair_id") REFERENCES "language_pairs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materials" ADD CONSTRAINT "FK_dbc2132c500bbd163b9495e3849" FOREIGN KEY ("language_pair_id") REFERENCES "language_pairs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_materials" ADD CONSTRAINT "FK_9ffa18dd4b4877031caa33cf3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_materials" ADD CONSTRAINT "FK_66770e3c8290d6f7f21d8a13986" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "words" ADD CONSTRAINT "FK_5d1325d242f797788c2ef8400ac" FOREIGN KEY ("language_pair_id") REFERENCES "language_pairs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_words" ADD CONSTRAINT "FK_854a015b8c2f510259c310cfbfd" FOREIGN KEY ("word_id") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_words" ADD CONSTRAINT "FK_da5007ae5c7458c8bb7e6358dfe" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_levels" ADD CONSTRAINT "FK_24e5aa312ead79c4f2874877e45" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_level_material_words" ADD CONSTRAINT "FK_effafe8aebb70c06ba0a9813ecb" FOREIGN KEY ("material_word_id") REFERENCES "material_words"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_level_material_words" ADD CONSTRAINT "FK_87bd2c52a9f45e37848af80ab16" FOREIGN KEY ("material_level_id") REFERENCES "material_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "material_level_material_words" DROP CONSTRAINT "FK_87bd2c52a9f45e37848af80ab16"`);
        await queryRunner.query(`ALTER TABLE "material_level_material_words" DROP CONSTRAINT "FK_effafe8aebb70c06ba0a9813ecb"`);
        await queryRunner.query(`ALTER TABLE "material_levels" DROP CONSTRAINT "FK_24e5aa312ead79c4f2874877e45"`);
        await queryRunner.query(`ALTER TABLE "material_words" DROP CONSTRAINT "FK_da5007ae5c7458c8bb7e6358dfe"`);
        await queryRunner.query(`ALTER TABLE "material_words" DROP CONSTRAINT "FK_854a015b8c2f510259c310cfbfd"`);
        await queryRunner.query(`ALTER TABLE "words" DROP CONSTRAINT "FK_5d1325d242f797788c2ef8400ac"`);
        await queryRunner.query(`ALTER TABLE "user_materials" DROP CONSTRAINT "FK_66770e3c8290d6f7f21d8a13986"`);
        await queryRunner.query(`ALTER TABLE "user_materials" DROP CONSTRAINT "FK_9ffa18dd4b4877031caa33cf3f4"`);
        await queryRunner.query(`ALTER TABLE "materials" DROP CONSTRAINT "FK_dbc2132c500bbd163b9495e3849"`);
        await queryRunner.query(`ALTER TABLE "user_language_pairs" DROP CONSTRAINT "FK_eacf9afa1ad6bef655db6f559e3"`);
        await queryRunner.query(`ALTER TABLE "user_language_pairs" DROP CONSTRAINT "FK_9011fba8f7afca66b69aba2b05c"`);
        await queryRunner.query(`ALTER TABLE "language_pairs" DROP CONSTRAINT "FK_2e128a16395a26e9819b7fbc71d"`);
        await queryRunner.query(`ALTER TABLE "language_pairs" DROP CONSTRAINT "FK_f939c2d41b7805edc32f6690f6c"`);
        await queryRunner.query(`DROP TABLE "material_level_material_words"`);
        await queryRunner.query(`DROP TABLE "material_levels"`);
        await queryRunner.query(`DROP TABLE "material_words"`);
        await queryRunner.query(`DROP TABLE "words"`);
        await queryRunner.query(`DROP TABLE "user_materials"`);
        await queryRunner.query(`DROP TYPE "public"."user_materials_status_enum"`);
        await queryRunner.query(`DROP TABLE "materials"`);
        await queryRunner.query(`DROP TYPE "public"."materials_language_level_enum"`);
        await queryRunner.query(`DROP TABLE "user_language_pairs"`);
        await queryRunner.query(`DROP TYPE "public"."user_language_pairs_status_enum"`);
        await queryRunner.query(`DROP TABLE "language_pairs"`);
        await queryRunner.query(`DROP TABLE "languages"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
