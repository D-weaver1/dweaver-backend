import path from "path";
import { DataSource } from "typeorm";
import {
    User,
    Language,
    LanguagePair,
    UserLanguagePair,
    UserMaterialLevel,
    Material,
    Word,
    MaterialWord,
    MaterialLevel,
    MaterialLevelMaterialWord,
    RefreshToken,
    AiAnalysisJob,
    AiAnalysisJobPayload,
} from "./entities";
import { env } from "./env";
import { Dictionary } from "./entities/Dictionary.entity";
import { DictionaryWord } from "./entities/DictionaryWord.entity";
import { LanguageTextTemplate } from "./entities/LanguageTextTemplate.entity";
import { Question } from "./entities/Question.entity";
import { Quiz } from "./entities/Quiz.entity";
import { QuizAnswer } from "./entities/QuizAnswer.entity";
import { QuizAttempt } from "./entities/QuizAttempt.entity";
import { TextTemplate } from "./entities/TextTemplate.entity";

const db = new DataSource({
    type: "postgres",
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    entities: [
        User,
        Language,
        LanguagePair,
        UserLanguagePair,
        UserMaterialLevel,
        Material,
        Word,
        MaterialWord,
        MaterialLevel,
        MaterialLevelMaterialWord,
        RefreshToken,
        AiAnalysisJob,
        AiAnalysisJobPayload,
        Dictionary,
        DictionaryWord,
        LanguageTextTemplate,
        Question,
        Quiz,
        QuizAnswer,
        QuizAttempt,
        TextTemplate,
    ],
    migrations: [path.resolve(__dirname, "migrations/*")],
    synchronize: false,
    migrationsRun: false,
});

export default db;
