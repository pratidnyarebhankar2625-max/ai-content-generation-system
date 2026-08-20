import { withAuth } from "@/lib/api/auth";
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
    const templatesIdx = parts.indexOf("templates");
    if (templatesIdx !== -1 && parts.length > templatesIdx + 1) {
      id = parts[templatesIdx + 1];
    }
  }

  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    throw new ApiError("Invalid template ID format. Expected a valid UUID.", "VALIDATION_ERROR", 400);
  }

  return id;
}

// PATCH /api/templates/[id]/favorite - Toggle or set favorite
export const PATCH = withAuth(async (req: Request, user: User, supabase: SupabaseClient, context?: { params?: Promise<{ id: string }> | { id: string } }) => {
  const id = await extractId(req, context);
  const dbService = new DbService(supabase, user.id);

  let is_favorite: boolean;
  try {
    const body = await req.json();
    if (typeof body.is_favorite === "boolean") {
      is_favorite = body.is_favorite;
    } else {
      const existing = await dbService.getTemplateById(id);
      if (!existing) {
        throw new ApiError("Template not found or unauthorized", "NOT_FOUND", 404);
      }
      is_favorite = !existing.is_favorite;
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    // If empty body, toggle
    const existing = await dbService.getTemplateById(id);
    if (!existing) {
      throw new ApiError("Template not found or unauthorized", "NOT_FOUND", 404);
    }
    is_favorite = !existing.is_favorite;
  }

  const updatedRecord = await dbService.updateTemplate(id, { is_favorite });

  return Response.json({
    success: true,
    data: updatedRecord,
  });
});

export const POST = PATCH;
