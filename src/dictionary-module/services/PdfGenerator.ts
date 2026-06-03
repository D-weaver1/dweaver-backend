import path from "path";
import { DictionaryWord } from "../../entities";
import puppeteer from "puppeteer";
import fs from "fs";

export default class PdfGenerator {
    constructor(
        private words: DictionaryWord[],
        private sourceLanguage: string,
        private targetLanguage: string,
        private mode: "s_t" | "t_s"
    ) {}

    generate = async () => {
        const logoPath = path.resolve(__dirname, "../../assets/logo.png");
        let base64Logo = "";

        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const mimeType = "image/png"; // Change to image/jpeg or image/svg+xml if needed
            base64Logo = `data:${mimeType};base64,${logoBuffer.toString("base64")}`;
        } else {
            console.warn("Logo file not found, rendering PDF without it.");
        }

        const words = this.words.map((dw) => ({
            left:
                this.mode === "s_t" ? dw.word.sourceText : dw.word.translation,
            right:
                this.mode === "s_t" ? dw.word.translation : dw.word.sourceText,
        }));
        const title =
            this.sourceLanguage === "uk"
                ? "Мій словник"
                : this.sourceLanguage === "de"
                  ? "Mein Wörterbuch"
                  : "My Dictionary";

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dictionary PDF</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            padding-bottom: 40px;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .logo {
            width: 114px;
            height: 28px;
            margin-right: 15px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <div class="header">
        <img width="114px" height="28px" src="${base64Logo}" alt="Logo" class="logo">
        <div class="title">${title}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>${this.mode === "s_t" ? this.sourceLanguage : this.targetLanguage}</th>
                <th>${this.mode === "s_t" ? this.targetLanguage : this.sourceLanguage}</th>
            </tr>
        </thead>
        <tbody>
            ${words
                .map(
                    (w) => `
                <tr>
                    <td>${w.left}</td>
                    <td>${w.right}</td>
                </tr>
            `
                )
                .join("")}
        </tbody>
    </table>
</body>
</html>`;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("table");

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
        });
        await browser.close();

        return pdfBuffer;
    };
}
