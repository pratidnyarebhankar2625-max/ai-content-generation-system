import { withAuth } from "@/lib/api/auth";
import { validateRequest } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Validation schema for creating a template
const createTemplateSchema = {
  title: {
    required: true,
    type: "string" as const,
    minLength: 1,
    maxLength: 200,
  },
  description: {
    required: true,
    type: "string" as const,
    minLength: 1,
    maxLength: 2000,
  },
  category: {
    required: true,
    type: "string" as const,
    minLength: 1,
    maxLength: 100,
  },
  content: {
    required: false,
    type: "string" as const,
    maxLength: 50000,
  },
  is_favorite: {
    required: false,
    type: "boolean" as const,
  },
  id: {
    required: false,
    type: "string" as const,
  },
};

// GET /api/templates - Query, search, filter, sort & paginate user templates
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const favoriteParam = searchParams.get("favorite") ?? searchParams.get("is_favorite");
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  let favorite: boolean | undefined;
  if (favoriteParam !== null && favoriteParam !== undefined) {
    if (favoriteParam === "true" || favoriteParam === "1") {
      favorite = true;
    } else if (favoriteParam === "false" || favoriteParam === "0") {
      favorite = false;
    } else {
      throw new ApiError("Invalid favorite parameter. Must be boolean.", "VALIDATION_ERROR", 400);
    }
  }

  let sortBy: "newest" | "oldest" | "title" | "created_at" | "updated_at" | undefined;
  if (sortByParam) {
    if (!["newest", "oldest", "title", "created_at", "updated_at"].includes(sortByParam)) {
      throw new ApiError("Invalid sortBy parameter", "VALIDATION_ERROR", 400);
    }
    sortBy = sortByParam as "newest" | "oldest" | "title" | "created_at" | "updated_at";
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

  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new ApiError("Limit must be an integer between 1 and 100", "VALIDATION_ERROR", 400);
  }

  const dbService = new DbService(supabase, user.id);
  const result = await dbService.getTemplates({
    search,
    category,
    favorite,
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

// POST /api/templates - Create user template
export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  validateRequest(body, createTemplateSchema, { allowUnknown: false });

  const title = body.title?.trim();
  const description = body.description?.trim();
  const category = body.category?.trim();
  const content = body.content !== undefined ? String(body.content) : "";
  const is_favorite = typeof body.is_favorite === "boolean" ? body.is_favorite : false;
  const id = body.id || undefined;

  const dbService = new DbService(supabase, user.id);
  const newRecord = await dbService.createTemplate({
    id,
    title,
    description,
    category,
    content,
    is_favorite,
  });

  return Response.json(
    {
      success: true,
      data: newRecord,
    },
    { status: 201 }
  );
});
