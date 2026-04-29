import express from "express";
import materialProcessingRoutes from "./adaptive-reading-module/material-processing/material-processing.routes";

const app = express();

app.use(express.json());

app.use("/material-processing", materialProcessingRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});

export default app;
