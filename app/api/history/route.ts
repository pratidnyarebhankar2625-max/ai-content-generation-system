import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Validation schema for creating/importing a generation
const createGenerationSchema = {
  title: {
    required: true,
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
  id: {
    required: false,
    type: "string" as const,
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

// GET /api/history - Query, search, filter, sort & paginate generations
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const statusParam = searchParams.get("status");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  let status: "completed" | "draft" | "failed" | "all" | undefined;
  if (statusParam) {
    if (!["completed", "draft", "failed", "all"].includes(statusParam)) {
      throw new ApiError("Invalid status parameter", "VALIDATION_ERROR", 400);
    }
    status = statusParam as "completed" | "draft" | "failed" | "all";
  }

  let sortBy: "newest" | "oldest" | "words" | "title" | "created_at" | "word_count" | undefined;
  if (sortByParam) {
    if (!["newest", "oldest", "words", "title", "created_at", "word_count"].includes(sortByParam)) {
      throw new ApiError("Invalid sortBy parameter", "VALIDATION_ERROR", 400);
    }
    sortBy = sortByParam as "newest" | "oldest" | "words" | "title" | "created_at" | "word_count";
  }

  let sortOrder: "asc" | "desc" | undefined;
  if (sortOrderParam) {
    if (!["asc", "desc"].includes(sortOrderParam)) {
      throw new ApiError("Invalid sortOrder parameter", "VALIDATION_ERROR", 400);
    }
    sortOrder = sortOrderParam as "asc" | "desc";
  }

  const page = pageParam ? parseInt(pageParam, 10) : 1;
  if (isNaN(page) || page < 1) {
    throw new ApiError("Page must be a positive integer", "VALIDATION_ERROR", 400);
  }

  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ApiError("Limit must be an integer between 1 and 100", "VALIDATION_ERROR", 400);
  }

  const dbService = new DbService(supabase, user.id);
  const result = await dbService.queryGenerations({
    search,
    category,
    status,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  return Response.json({
    success: true,
    data: result,
  });
});

// POST /api/history - Create / import generation
export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  validateRequest(body, createGenerationSchema);

  const title = body.title?.trim();
  const template = body.template?.trim() || "Custom Template";
  const category = body.category?.trim() || "General";
  const status = (body.status || "completed") as "completed" | "draft" | "failed";
  const preview = body.preview !== undefined ? body.preview : "";
  const wordCount = body.word_count !== undefined ? Number(body.word_count) : (body.wordCount !== undefined ? Number(body.wordCount) : 0);
  const createdAt = body.created_at || body.createdAt || undefined;
  const id = body.id || undefined;

  const dbService = new DbService(supabase, user.id);
  const newRecord = await dbService.createGeneration({
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
      data: newRecord,
    },
    { status: 201 }
  );
});
