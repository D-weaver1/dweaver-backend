type SpeechVoiceConfig = {
    locale: string;
    voice: string;
};

const VOICE_BY_LANGUAGE_CODE: Record<string, SpeechVoiceConfig> = {
    en: {
        locale: "en-US",
        voice: "en-US-JennyNeural",
    },
    uk: {
        locale: "uk-UA",
        voice: "uk-UA-PolinaNeural",
    },
    de: {
        locale: "de-DE",
        voice: "de-DE-KatjaNeural",
    },
};

function escapeXml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

export class TtsService {
    async synthesizePronunciation(text: string, languageCode: string) {
        const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
        const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;

        if (!azureSpeechKey || !azureSpeechRegion) {
            throw new Error("Azure Speech env variables are not configured");
        }

        const normalizedText = text.trim();
        const normalizedLanguageCode = languageCode.trim().toLowerCase();

        if (!normalizedText) {
            throw new Error("Text is required");
        }

        const voiceConfig = VOICE_BY_LANGUAGE_CODE[normalizedLanguageCode];

        if (!voiceConfig) {
            throw new Error(`Unsupported language code: ${languageCode}`);
        }

        const ssml = `
<speak version="1.0" xml:lang="${voiceConfig.locale}">
  <voice xml:lang="${voiceConfig.locale}" name="${voiceConfig.voice}">
    ${escapeXml(normalizedText)}
  </voice>
</speak>`.trim();

        const url = `https://${azureSpeechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": azureSpeechKey,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
                "User-Agent": "d-weaver",
            },
            body: ssml,
        });

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Azure TTS error: ${response.status} ${response.statusText}. ${errorText}`
            );
        }

        const arrayBuffer = await response.arrayBuffer();

        return Buffer.from(arrayBuffer);
    }
}
