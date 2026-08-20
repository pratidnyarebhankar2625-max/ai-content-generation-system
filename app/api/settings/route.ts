import { withAuth } from "@/lib/api/auth";
import { validateRequest, type Schema } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Validation schema for updating user settings
const updateSettingsSchema: Schema = {
  theme: {
    required: false,
    type: "string",
    allowedValues: ["light", "dark", "system"],
  },
  language: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 30,
  },
  writing_tone: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 50,
  },
  default_ai_model: {
    required: false,
    type: "string",
    minLength: 2,
    maxLength: 100,
  },
  email_notifications: {
    required: false,
    type: "boolean",
  },
  push_notifications: {
    required: false,
    type: "boolean",
  },
  generation_alerts: {
    required: false,
    type: "boolean",
  },
};

// GET /api/settings - Fetch current authenticated user's settings
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  const dbService = new DbService(supabase, user.id);
  const settings = await dbService.getUserSettings();

  return Response.json({
    success: true,
    data: settings,
  });
});

// PATCH /api/settings - Update current authenticated user's settings
export const PATCH = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  // Strictly reject unexpected fields (such as user_id, id, byok_api_key) and require at least one field
  validateRequest(body, updateSettingsSchema, {
    allowUnknown: false,
    requireAtLeastOne: true,
  });

  const payload = body as {
    theme?: string;
    language?: string;
    writing_tone?: string;
    default_ai_model?: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    generation_alerts?: boolean;
  };

  const dbService = new DbService(supabase, user.id);
  const updatedSettings = await dbService.updateSettings(payload);

  return Response.json({
    success: true,
    data: updatedSettings,
  });
});
