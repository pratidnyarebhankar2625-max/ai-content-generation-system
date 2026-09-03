import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { PromptService } from "@/lib/api/services/prompt";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/api/services/openrouter";
import { RateLimiterService, InFlightGenerationTracker } from "@/lib/api/services/rate-limiter";
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

  // 2. In-Flight Duplicate Generation Protection
  const requestKey = InFlightGenerationTracker.createSignature({
    userId: user.id,
    prompt,
    template,
    category,
    tone: requestedTone,
    language: requestedLanguage,
    isContinue,
  });
  const releaseLock = InFlightGenerationTracker.acquire(requestKey);

  let usageId: string | undefined;
  let dbService: DbService;

  try {
    // 3. Fetch lean user settings for defaults if available
    dbService = new DbService(supabase, user.id);
    const userSettings = await dbService.getGenerationSettings();

    const finalTone = requestedTone || userSettings?.writing_tone || "Professional";
    const finalLanguage = requestedLanguage || userSettings?.language || "English (US)";
    const configuredModel = userSettings?.default_ai_model || OpenRouterService.DEFAULT_MODEL;

    // 4. Database-backed Rate Limit & Quota Check (BEFORE calling OpenRouter)
    usageId = await RateLimiterService.checkAndReserveQuota(
      dbService,
      "generate",
      configuredModel
    );

    // 5. Build prompts via PromptService
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

    // 6. Construct messages array for OpenRouter
    let openRouterMessages: OpenRouterMessage[] = [];

    if (messages && Array.isArray(messages) && messages.length > 0) {
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

    // 7. Initialize OpenRouter service & stream response
    let reportedTokens: { promptTokens?: number; completionTokens?: number; totalTokens?: number } = {};

    const openRouter = OpenRouterService.getInstance();
    const stream = await openRouter.streamCompletion({
      messages: openRouterMessages,
      model: configuredModel,
      signal: req.signal,
      onUsage: (u) => {
        reportedTokens = u;
      },
    });

    // Mark usage completed when stream starts successfully
    await dbService.markAiUsageCompleted({
      usageId,
      promptTokens: reportedTokens.promptTokens ?? null,
      completionTokens: reportedTokens.completionTokens ?? null,
      totalTokens: reportedTokens.totalTokens ?? null,
    });

    const wrappedStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          releaseLock();
        }
      },
      cancel(reason) {
        releaseLock();
        return stream.cancel(reason);
      },
    });

    return new Response(wrappedStream, {
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
  } catch (err: any) {
    releaseLock();
    if (usageId && dbService!) {
      await dbService.markAiUsageFailed({
        usageId,
        errorMessage: err?.message || 'Generation failed',
      }).catch(() => {});
    }
    throw err;
  }
});

