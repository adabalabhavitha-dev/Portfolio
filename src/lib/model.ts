/**
 * Model resolution. Server-only.
 *
 * This module reads `process.env` directly and MUST only ever be imported from
 * a route handler or server component — importing it from a client component
 * would inline the env lookups into the browser bundle. `getModel()` throws if
 * the key for the selected provider is missing; the key itself is never logged,
 * returned, echoed in an error message, or attached to a response.
 *
 * Configuration (see `.env.example`):
 *   MODEL_PROVIDER = "google" (default) | "openai"
 *   MODEL_ID       = optional override for the model id
 */

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
// `ProviderOptions` is used internally by `ai` but is not re-exported from its
// public entry point. `@ai-sdk/provider` owns the canonical definition
// (`Record<string, JSONObject>`); declaring it locally would silently drift from
// the type the SDK actually expects and fail to typecheck at the call site.
import type { SharedV4ProviderOptions as ProviderOptions } from "@ai-sdk/provider";

export type ModelProvider = "google" | "openai";

/**
 * Defaults are current, cheap and fast — this is a short, grounded Q&A
 * assistant, not a reasoning workload.
 *
 *  - google  `gemini-3.8-flash` — the current Gemini Flash generation listed in
 *    `@ai-sdk/google`'s `GoogleModelId` union and in the provider docs'
 *    "Model Capabilities" table.
 *  - openai  `gpt-5.4-mini` — the current cheap mini chat model in
 *    `@ai-sdk/openai`'s `OpenAIChatModelId` union.
 */
export const DEFAULT_MODEL_ID: Record<ModelProvider, string> = {
  google: "gemini-3.8-flash",
  openai: "gpt-5.4-mini",
};

/** Env var that must be set for each provider. */
const REQUIRED_KEY_ENV: Record<ModelProvider, string> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

export type ResolvedModel = {
  model: LanguageModel;
  provider: ModelProvider;
  modelId: string;
  /**
   * `gpt-5.4-mini` is a reasoning model, and the OpenAI provider strips
   * `temperature` for reasoning models unless the effort is explicitly turned
   * off. Setting `reasoningEffort: "none"` keeps the prompt's 0.3 usable. It is
   * a no-op for non-reasoning ids and is ignored by every other provider.
   */
  providerOptions: ProviderOptions;
};

function readProvider(): ModelProvider {
  const raw = (process.env.MODEL_PROVIDER ?? "google").trim().toLowerCase();
  if (raw === "google" || raw === "openai") return raw;
  // Do not echo the value back beyond the allowed set — it is harmless, but a
  // typo should be loud and specific.
  throw new Error(
    `MODEL_PROVIDER must be "google" or "openai" (received "${raw}").`,
  );
}

function readModelId(provider: ModelProvider): string {
  const override = (process.env.MODEL_ID ?? "").trim();
  return override.length > 0 ? override : DEFAULT_MODEL_ID[provider];
}

/**
 * Resolve the language model for this request.
 *
 * @throws if `MODEL_PROVIDER` is not one of the supported providers, or if the
 * API key that provider requires is missing. The thrown message names the env
 * var only — never its value.
 */
export function getModel(): ResolvedModel {
  const provider = readProvider();

  const key = process.env[REQUIRED_KEY_ENV[provider]];
  if (typeof key !== "string" || key.trim().length === 0) {
    throw new Error(
      `Missing ${REQUIRED_KEY_ENV[provider]}. Add it to .env.local to enable the chat assistant.`,
    );
  }

  const modelId = readModelId(provider);

  if (provider === "google") {
    return {
      model: google(modelId),
      provider,
      modelId,
      providerOptions: {},
    };
  }

  return {
    model: openai(modelId),
    provider,
    modelId,
    providerOptions: { openai: { reasoningEffort: "none" } },
  };
}

/** Human-readable label for logs. Contains no secrets. */
export function describeModel(resolved: ResolvedModel): string {
  return `${resolved.provider}/${resolved.modelId}`;
}