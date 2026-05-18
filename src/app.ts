import express from "express";
import materialProcessingRoutes from "./adaptive-reading-module/material-processing/material-processing.routes";
import userLanguagePairRoutes from "./adaptive-reading-module/user-language-pairs/user-language-pair.routes";
import authRoutes from "./adaptive-reading-module/auth/auth.routes";
import cookieParser from "cookie-parser";
import cors from "cors";

import languageRoutes from "./management-module/language/language.routes";
import languagePairRoutes from "./management-module/language-pair/language-pair.routes";
import aiTextAnalysisRoutes from "./ai-text-analysis-module/ai-text-analysis.routes";

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

app.use("/languages", languageRoutes);
app.use("/language-pairs", languagePairRoutes);
app.use("/ai-text-analysis", aiTextAnalysisRoutes);

app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
    });
});



export default app;
