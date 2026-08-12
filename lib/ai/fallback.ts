import { isTransientAIError } from "./errors";
import type { AIGenerateOptions, AIGenerationResult, AIProvider } from "./types";

/**
 * 주 공급자의 일시 장애에만 한 번 대체 공급자를 사용한다.
 *
 * 4xx 요청 오류·안전 정책 거절에는 재전송하지 않는다. 그래야 잘못된 프롬프트나
 * 거절된 요청을 다른 공급자에 불필요하게 보내거나, 두 번 생성해 비용이 늘지 않는다.
 */
export class FallbackAIProvider implements AIProvider {
  readonly name: string;
  readonly model: string;

  constructor(
    private readonly primary: AIProvider,
    private readonly fallbackProvider: AIProvider,
  ) {
    this.name = primary.name;
    this.model = primary.model;
  }

  async generate(prompt: string, opts?: AIGenerateOptions): Promise<AIGenerationResult> {
    try {
      return await this.primary.generate(prompt, opts);
    } catch (error) {
      if (!isTransientAIError(error)) throw error;
      const result = await this.fallbackProvider.generate(prompt, opts);
      return { ...result, fallback: true };
    }
  }
}
