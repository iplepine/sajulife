import assert from "node:assert/strict";
import test from "node:test";
import { FallbackAIProvider } from "./fallback";
import { geminiSchemaToJsonSchema } from "./openai";
import type { AIGenerationResult, AIProvider } from "./types";

function provider(
  name: string,
  model: string,
  generate: () => Promise<AIGenerationResult>,
): AIProvider {
  return { name, model, generate };
}

test("OpenAI transient failure uses Gemini once and marks the actual result", async () => {
  let fallbackCalls = 0;
  const primary = provider("openai", "gpt-5.6-luna", async () => {
    throw Object.assign(new Error("temporarily unavailable"), { status: 503 });
  });
  const fallback = provider("gemini", "gemini-2.5-flash", async () => {
    fallbackCalls += 1;
    return { text: "fallback answer", provider: "gemini", model: "gemini-2.5-flash", fallback: false };
  });

  const result = await new FallbackAIProvider(primary, fallback).generate("prompt");

  assert.equal(fallbackCalls, 1);
  assert.deepEqual(result, {
    text: "fallback answer",
    provider: "gemini",
    model: "gemini-2.5-flash",
    fallback: true,
  });
});

test("invalid primary request is not re-sent to Gemini", async () => {
  let fallbackCalls = 0;
  const primary = provider("openai", "gpt-5.6-luna", async () => {
    throw Object.assign(new Error("invalid request"), { status: 400 });
  });
  const fallback = provider("gemini", "gemini-2.5-flash", async () => {
    fallbackCalls += 1;
    return { text: "unexpected", provider: "gemini", model: "gemini-2.5-flash", fallback: false };
  });

  await assert.rejects(() => new FallbackAIProvider(primary, fallback).generate("prompt"));
  assert.equal(fallbackCalls, 0);
});

test("Gemini Schema is translated to JSON Schema before OpenAI structured output", () => {
  assert.deepEqual(
    geminiSchemaToJsonSchema({
      type: "OBJECT",
      propertyOrdering: ["title"],
      properties: {
        title: { type: "STRING" },
        items: { type: "ARRAY", items: { type: "INTEGER" } },
      },
      required: ["title", "items"],
    }),
    {
      type: "object",
      properties: {
        title: { type: "string" },
        items: { type: "array", items: { type: "integer" } },
      },
      required: ["title", "items"],
    },
  );
});
