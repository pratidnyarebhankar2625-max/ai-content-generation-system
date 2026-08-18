import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function extractId(req: Request, context?: { params?: Promise<{ id: string }> | { id: string } }): Promise<string> {
  let id = "";
  if (context?.params) {
    const resolved = await context.params;
    id = resolved?.id || "";
  }
  if (!id) {
    const pathname = new URL(req.url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    id = parts[parts.length - 1] || "";
  }

  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    throw new ApiError("Invalid generation ID format. Expected a valid UUID.", "VALIDATION_ERROR", 400);
  }

  return id;
}

const updateGenerationSchema = {
  title: {
    required: false,
    type: "string" as const,
    minLength: 1,
    maxLength: 500,
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

// GET /api/history/[id] - Fetch single generation
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  const dbService = new DbService(supabase, user.id);
  const record = await dbService.getGenerationById(id);

  if (!record) {
    throw new ApiError("Generation not found or unauthorized", "NOT_FOUND", 404);
  }

  return Response.json({
    success: true,
    data: record,
  });
});

// PATCH /api/history/[id] - Update generation
export const PATCH = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  validateRequest(body, updateGenerationSchema);

  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.template !== undefined) updates.template = body.template.trim();
  if (body.category !== undefined) updates.category = body.category.trim();
  if (body.status !== undefined) updates.status = body.status;
  if (body.preview !== undefined) updates.preview = body.preview;
  if (body.word_count !== undefined) updates.word_count = Number(body.word_count);
  else if (body.wordCount !== undefined) updates.word_count = Number(body.wordCount);
  if (body.created_at !== undefined) updates.created_at = body.created_at;
  else if (body.createdAt !== undefined) updates.created_at = body.createdAt;

  const dbService = new DbService(supabase, user.id);
  const updatedRecord = await dbService.updateGeneration(id, updates);

  return Response.json({
    success: true,
    data: updatedRecord,
  });
});

// PUT /api/history/[id] - Support PUT as well for update
export const PUT = PATCH;

// DELETE /api/history/[id] - Delete generation
export const DELETE = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  const dbService = new DbService(supabase, user.id);
  const deletedRecord = await dbService.deleteGeneration(id);

  return Response.json({
    success: true,
    message: "Generation deleted successfully",
    data: deletedRecord,
  });
});
