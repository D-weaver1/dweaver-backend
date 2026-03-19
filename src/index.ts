import app from "./app";
import db from "./data-source";
import { env } from "./env";

const start = async () => {
    try {
        await db.initialize();
        console.log("Postgres: connected");

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
