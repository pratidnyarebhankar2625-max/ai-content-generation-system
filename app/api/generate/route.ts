import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { PromptService } from "@/lib/api/services/prompt";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/api/services/openrouter";
import { RateLimiterService } from "@/lib/api/services/rate-limiter";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Validation schema for incoming generation requests
const generateSchema = {
  prompt: {
    required: true,
    type: "string" as const,
    minLength: 2,
    maxLength: 5000,
  },
  template: {
    required: false,
    type: "string" as const,
    maxLength: 200,
  },
  category: {
    required: false,
    type: "string" as const,
    maxLength: 100,
  },
  tone: {
    required: false,
    type: "string" as const,
    maxLength: 100,
  },
  language: {
    required: false,
    type: "string" as const,
    maxLength: 100,
  },
  isContinue: {
    required: false,
    type: "boolean" as const,
  },
  generationId: {
    required: false,
    type: "string" as const,
    maxLength: 100,
  },
  keywords: {
    required: false,
    type: "string" as const,
    maxLength: 500,
  },
  length: {
    required: false,
    type: "string" as const,
    maxLength: 100,
  },
  context: {
    required: false,
    type: "string" as const,
    maxLength: 5000,
  },
  previousContent: {
    required: false,
    type: "string" as const,
    maxLength: 50000,
  },
  messages: {
    required: false,
    type: "array" as const,
  },
};

export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Validate request payload (strictly disallow unexpected/injected fields)
  validateRequest(body, generateSchema, { allowUnknown: false });

  const {
    prompt,
    template = "General Content",
    category = "General",
    tone: requestedTone,
    language: requestedLanguage,
    keywords,
    length,
    context,
    messages,
    isContinue = false,
    previousContent,
  } = body;

  // 2. Fetch user settings for defaults if available
  const dbService = new DbService(supabase, user.id);
  const userSettings = await dbService.getUserSettings();

  const finalTone = requestedTone || userSettings?.writing_tone || "Professional";
  const finalLanguage = requestedLanguage || userSettings?.language || "English (US)";
  const configuredModel = userSettings?.default_ai_model || OpenRouterService.DEFAULT_MODEL;

  // 3. Database-backed Rate Limit & Quota Check (BEFORE calling OpenRouter)
  const usageId = await RateLimiterService.checkAndReserveQuota(
    dbService,
    "generate",
    configuredModel
  );

  // 4. Build prompts via PromptService
  const systemPrompt = PromptService.buildSystemPrompt({
    prompt,
    template,
    category,
    tone: finalTone,
    language: finalLanguage,
    length,
    keywords,
    context,
    isContinue,
  });

  const userPrompt = PromptService.buildUserPrompt({
    prompt,
    template,
    category,
    tone: finalTone,
    language: finalLanguage,
    length,
    keywords,
    context,
    isContinue,
    previousContent,
  });

  // 5. Construct messages array for OpenRouter
  let openRouterMessages: OpenRouterMessage[] = [];

  if (messages && Array.isArray(messages) && messages.length > 0) {
    // Sanitize and include conversation history if provided
    openRouterMessages = [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];
  } else {
    openRouterMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
  }

  // 6. Initialize OpenRouter service & stream response
  let stream: ReadableStream<Uint8Array>;
  let reportedTokens: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};

  try {
    const openRouter = new OpenRouterService();
    stream = await openRouter.streamCompletion({
      messages: openRouterMessages,
      model: configuredModel,
      signal: req.signal,
      onUsage: (u) => {
        reportedTokens = u;
      },
    });
  } catch (err: any) {
    await dbService.markAiUsageFailed({
      usageId,
      errorMessage: err?.message || 'Generation failed',
    });
    throw err;
  }

  // Mark usage completed when stream starts successfully
  await dbService.markAiUsageCompleted({
    usageId,
    promptTokens: reportedTokens.promptTokens ?? null,
    completionTokens: reportedTokens.completionTokens ?? null,
    totalTokens: reportedTokens.totalTokens ?? null,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-User-Id": user.id,
      "X-Model-Used": configuredModel,
      "X-Usage-Id": usageId,
    },
  });
});

