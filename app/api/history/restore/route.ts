import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const restoreGenerationSchema = {
  id: {
    required: true,
    type: "string" as const,
  },
  title: {
    required: true,
    type: "string" as const,
    minLength: 1,
  },
  template: {
    required: false,
    type: "string" as const,
  },
  category: {
    required: false,
    type: "string" as const,
  },
  status: {
    required: false,
    type: "string" as const,
    allowedValues: ["completed", "draft", "failed"],
  },
  preview: {
    required: false,
    type: "string" as const,
  },
  word_count: {
    required: false,
    type: "number" as const,
  },
  wordCount: {
    required: false,
    type: "number" as const,
  },
  created_at: {
    required: false,
    type: "string" as const,
  },
  createdAt: {
    required: false,
    type: "string" as const,
  },
};

// POST /api/history/restore - Restore a previously deleted generation
export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  validateRequest(body, restoreGenerationSchema, { allowUnknown: false });

  const id = body.id;
  const title = body.title?.trim();
  const template = body.template?.trim() || "Custom Template";
  const category = body.category?.trim() || "General";
  const status = (body.status || "completed") as "completed" | "draft" | "failed";
  const preview = body.preview !== undefined ? body.preview : "";
  const wordCount = body.word_count !== undefined ? Number(body.word_count) : (body.wordCount !== undefined ? Number(body.wordCount) : 0);
  const createdAt = body.created_at || body.createdAt || new Date().toISOString();

  const dbService = new DbService(supabase, user.id);
  const restoredRecord = await dbService.createGeneration({
    id,
    title,
    template,
    category,
    status,
    preview,
    word_count: isNaN(wordCount) ? 0 : wordCount,
    created_at: createdAt,
  });

  return Response.json(
    {
      success: true,
      message: "Generation restored successfully",
      data: restoredRecord,
    },
    { status: 201 }
  );
});
