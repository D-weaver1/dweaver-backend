export class ResponseParserService {
    parse(rawResponse: string): unknown {
        try {
            return JSON.parse(rawResponse);
        } catch {
            throw new Error("AI response is not valid JSON");
        }
    }
}