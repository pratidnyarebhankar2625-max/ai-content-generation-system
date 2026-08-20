import { withAuth } from "@/lib/api/auth";
import { validateRequest, type Schema } from "@/lib/api/validator";
import { DbService } from "@/lib/api/services/db";
import { ApiError } from "@/lib/api/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Validation schema for updating user profile
const updateProfileSchema: Schema = {
  name: {
    required: false,
    type: "string",
    minLength: 1,
    maxLength: 100,
  },
  avatar: {
    required: false,
    type: "string",
    maxLength: 2000,
    nullable: true,
  },
  bio: {
    required: false,
    type: "string",
    maxLength: 1000,
    nullable: true,
  },
};

// GET /api/profile - Fetch current authenticated user's profile
export const GET = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  const dbService = new DbService(supabase, user.id);
  const profile = await dbService.getProfile();

  return Response.json({
    success: true,
    data: profile,
  });
});

// PATCH /api/profile - Update current authenticated user's profile
export const PATCH = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError("Invalid JSON request body", "VALIDATION_ERROR", 400);
  }

  // Strictly reject unexpected fields (like user_id, id, email) and require at least one field
  validateRequest(body, updateProfileSchema, {
    allowUnknown: false,
    requireAtLeastOne: true,
  });

  const payload = body as {
    name?: string;
    avatar?: string | null;
    bio?: string | null;
  };

  const dbService = new DbService(supabase, user.id);
  const updatedProfile = await dbService.updateProfile({
    name: payload.name !== undefined ? payload.name.trim() : undefined,
    avatar: payload.avatar !== undefined ? payload.avatar : undefined,
    bio: payload.bio !== undefined ? payload.bio : undefined,
  });

  return Response.json({
    success: true,
    data: updatedProfile,
  });
});
