import type { Request, Response } from "express";
import { TtsService } from "./tts.service";

const ttsService = new TtsService();

export class TtsController {
    async pronunciation(request: Request, response: Response) {
        try {
            const { text, languageCode } = request.body as {
                text?: string;
                languageCode?: string;
            };

            if (!text || !languageCode) {
                return response.status(400).json({
                    message: "text and languageCode are required",
                });
            }

            const audioBuffer = await ttsService.synthesizePronunciation(
                text,
                languageCode
            );

            response.setHeader("Content-Type", "audio/mpeg");
            response.setHeader("Content-Length", audioBuffer.length);

            return response.send(audioBuffer);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to synthesize speech";

            return response.status(500).json({
                message,
            });
        }
    }
}
