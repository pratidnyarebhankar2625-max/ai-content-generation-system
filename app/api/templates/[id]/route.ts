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
    // Find the segment following 'templates'
    const templatesIdx = parts.indexOf("templates");
    if (templatesIdx !== -1 && parts.length > templatesIdx + 1) {
      id = parts[templatesIdx + 1];
    } else {
      id = parts[parts.length - 1] || "";
    }
  }

  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    throw new ApiError("Invalid template ID format. Expected a valid UUID.", "VALIDATION_ERROR", 400);
  }

  return id;
}

const updateTemplateSchema = {
  title: {
    required: false,
    type: "string" as const,
    minLength: 1,
    maxLength: 200,
  },
  description: {
    required: false,
    type: "string" as const,
    minLength: 1,
    maxLength: 2000,
  },
  category: {
    required: false,
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
};

// GET /api/templates/[id] - Fetch single template
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  const dbService = new DbService(supabase, user.id);
  const record = await dbService.getTemplateById(id);

  if (!record) {
    throw new ApiError("Template not found or unauthorized", "NOT_FOUND", 404);
  }

  return Response.json({
    success: true,
    data: record,
  });
});

// PATCH /api/templates/[id] - Update template
export const PATCH = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  validateRequest(body, updateTemplateSchema);

  const updates: Record<string, any> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.category !== undefined) updates.category = body.category.trim();
  if (body.content !== undefined) updates.content = String(body.content);
  if (body.is_favorite !== undefined) updates.is_favorite = Boolean(body.is_favorite);

  const dbService = new DbService(supabase, user.id);
  const updatedRecord = await dbService.updateTemplate(id, updates);

  return Response.json({
    success: true,
    data: updatedRecord,
  });
});

// PUT /api/templates/[id] - Support PUT as alias for update
export const PUT = PATCH;

// DELETE /api/templates/[id] - Delete template
export const DELETE = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  const dbService = new DbService(supabase, user.id);
  const deletedRecord = await dbService.deleteTemplate(id);

  return Response.json({
    success: true,
    message: "Template deleted successfully",
    data: deletedRecord,
  });
});
