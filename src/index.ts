import app from "./app";
import { presetData } from "./data-preset";
import db from "./data-source";
import { env } from "./env";
import { setupFixtures } from "./fixtures";

const start = async () => {
    try {
        await db.initialize();
        console.log("Postgres: connected");

        if (await setupFixtures()) {
            console.log("Fixtures: loaded");
        }

        await presetData();

        app.listen(env.PORT, () => {
            console.log(`Server started on port ${env.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:");
        console.error(error);
        process.exit(1);
    }
};

start();
