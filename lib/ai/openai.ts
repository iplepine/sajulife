import OpenAI from "openai";
import { EmptyAIResponseError } from "./errors";
import type { AIGenerateOptions, AIGenerationResult, AIProvider } from "./types";

const DEFAULT_TIMEOUT_MS = 120_000;
const REASONING_EFFORTS = new Set(["none", "low", "medium", "high", "xhigh", "max"]);

/** OpenAI Responses API provider. User prompts and outputs are not retained by the API. */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;
  private readonly client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({
      apiKey,
      timeout: configuredTimeoutMs(),
      // Gemini fallback policy is handled explicitly below the provider boundary.
      maxRetries: 0,
    });
    this.model = model;
  }

  async generate(prompt: string, opts: AIGenerateOptions = {}): Promise<AIGenerationResult> {
    const format = responseFormat(opts);
    const response = await this.client.responses.create({
      model: this.model,
      input: prompt,
      instructions: opts.systemInstruction,
      max_output_tokens: opts.maxOutputTokens,
      temperature: opts.temperature,
      reasoning: { effort: configuredReasoningEffort() },
      safety_identifier: opts.safetyIdentifier,
      // Birth/family data and consultations are sensitive. Do not retain response objects.
      store: false,
      ...(format ? { text: { format } } : {}),
    });
    const text = response.output_text?.trim();
    if (!text) throw new EmptyAIResponseError("OpenAI");
    return { text, provider: this.name, model: this.model, fallback: false };
  }
}

function configuredTimeoutMs(): number {
  const parsed = Number(process.env.OPENAI_TIMEOUT_MS);
  return Number.isSafeInteger(parsed) && parsed >= 10_000 && parsed <= 300_000
    ? parsed
    : DEFAULT_TIMEOUT_MS;
}

function configuredReasoningEffort(): "none" | "low" | "medium" | "high" | "xhigh" | "max" {
  const value = process.env.OPENAI_REASONING_EFFORT?.trim().toLowerCase() ?? "low";
  return REASONING_EFFORTS.has(value)
    ? (value as "none" | "low" | "medium" | "high" | "xhigh" | "max")
    : "low";
}

function responseFormat(opts: AIGenerateOptions):
  | { type: "json_object" }
  | { type: "json_schema"; name: string; schema: Record<string, unknown>; strict: false }
  | undefined {
  if (opts.responseMimeType !== "application/json") return undefined;
  if (!opts.responseSchema || typeof opts.responseSchema !== "object") return { type: "json_object" };
  return {
    type: "json_schema",
    name: "sajulife_response",
    schema: geminiSchemaToJsonSchema(opts.responseSchema) as Record<string, unknown>,
    // Existing production schemas use Gemini-specific ordering hints. Keep compatibility
    // during the provider migration; server-side parse/quality gates remain authoritative.
    strict: false,
  };
}

/** Gemini's Schema enum uses upper-case types and propertyOrdering, unlike JSON Schema. */
export function geminiSchemaToJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(geminiSchemaToJsonSchema);
  if (!value || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "propertyOrdering") continue;
    if (key === "type" && typeof child === "string") {
      result.type = geminiTypeToJsonSchemaType(child);
      continue;
    }
    result[key] = geminiSchemaToJsonSchema(child);
  }
  return result;
}

function geminiTypeToJsonSchemaType(type: string): string {
  const mapped: Record<string, string> = {
    STRING: "string",
    NUMBER: "number",
    INTEGER: "integer",
    BOOLEAN: "boolean",
    ARRAY: "array",
    OBJECT: "object",
  };
  return mapped[type] ?? type.toLowerCase();
}
