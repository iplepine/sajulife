import { GoogleGenAI, type Schema } from "@google/genai";
import type { AIGenerateOptions, AIProvider } from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly model: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string, opts: AIGenerateOptions = {}): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: opts.temperature,
        maxOutputTokens: opts.maxOutputTokens,
        systemInstruction: opts.systemInstruction,
        responseMimeType: opts.responseMimeType,
        responseSchema: opts.responseSchema as Schema | undefined,
      },
    });
    return response.text ?? "";
  }
}
