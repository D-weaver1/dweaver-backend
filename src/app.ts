import express from "express";
import materialProcessingRoutes from "./adaptive-reading-module/material-processing/material-processing.routes";
import userLanguagePairRoutes from "./adaptive-reading-module/user-language-pairs/user-language-pair.routes";
import authRoutes from "./adaptive-reading-module/auth/auth.routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import materialRoutes from "./adaptive-reading-module/materials/material.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use("/auth", authRoutes);

app.use("/material-processing", materialProcessingRoutes);

app.use("/user-language-pairs", userLanguagePairRoutes);

app.use("/materials", materialRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});

export default app;
