export type AIGenerateOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  /** "application/json"이면 모델이 JSON만 출력한다. responseSchema와 함께 쓴다. */
  responseMimeType?: string;
  /** Gemini responseSchema (구조 강제). @google/genai의 Schema 객체. */
  responseSchema?: unknown;
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(prompt: string, opts?: AIGenerateOptions): Promise<string>;
}
