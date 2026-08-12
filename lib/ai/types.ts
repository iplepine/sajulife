export type AIGenerateOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  /** "application/json"이면 모델이 JSON만 출력한다. responseSchema와 함께 쓴다. */
  responseMimeType?: string;
  /** 기존 Gemini Schema 또는 JSON Schema. provider가 자기 형식으로 변환한다. */
  responseSchema?: unknown;
  /** OpenAI 정책 위반 탐지용 익명화된 안정 식별자. 원래 사용자 ID는 넣지 않는다. */
  safetyIdentifier?: string;
};

export type AIGenerationResult = {
  text: string;
  provider: string;
  model: string;
  /** 이번 호출이 주 공급자 장애로 fallback 공급자를 사용했는지 여부. */
  fallback: boolean;
};

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(prompt: string, opts?: AIGenerateOptions): Promise<AIGenerationResult>;
}
