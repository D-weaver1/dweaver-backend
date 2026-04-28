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
} from "./entities";
import { env } from "./env";

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
    ],
    migrations: [path.resolve(__dirname, "migrations/*")],
    synchronize: false,
    migrationsRun: false,
});

export default db;
