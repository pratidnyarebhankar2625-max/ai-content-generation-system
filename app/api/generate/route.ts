import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { PromptService } from "@/lib/api/services/prompt";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/api/services/openrouter";
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
  },
  category: {
    required: false,
    type: "string" as const,
  },
  tone: {
    required: false,
    type: "string" as const,
  },
  language: {
    required: false,
    type: "string" as const,
  },
  isContinue: {
    required: false,
    type: "boolean" as const,
  },
  generationId: {
    required: false,
    type: "string" as const,
  },
};

export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 1. Validate request payload
  validateRequest(body, generateSchema);

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

  // 3. Build prompts via PromptService
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

  // 4. Construct messages array for OpenRouter
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

  // 5. Initialize OpenRouter service & stream response
  const openRouter = new OpenRouterService();
  const stream = await openRouter.streamCompletion({
    messages: openRouterMessages,
    model: configuredModel,
    signal: req.signal,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
      "X-User-Id": user.id,
      "X-Model-Used": configuredModel,
    },
  });
});
