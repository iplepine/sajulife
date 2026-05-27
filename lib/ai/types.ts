export type AIGenerateOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(prompt: string, opts?: AIGenerateOptions): Promise<string>;
}
