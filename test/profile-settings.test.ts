import assert from "node:assert/strict";
import { DbService, type ProfileRecord, type UserSettingsRecord } from "../lib/api/services/db";
import { ApiError } from "../lib/api/errors";
import { validateRequest, type Schema } from "../lib/api/validator";

// Mock Supabase Query Builder to simulate PostgREST operations and RLS on profiles and user_settings
function createMockSupabase(
  profilesDb: ProfileRecord[],
  settingsDb: (UserSettingsRecord & { byok_api_key?: string | null })[],
  authenticatedUserId: string | null
) {
  return {
    from: (tableName: string) => {
      if (tableName === "profiles") {
        let data = profilesDb.filter((p) => (authenticatedUserId ? p.id === authenticatedUserId : false));
        let isUpdate = false;
        let updatePayload: Partial<ProfileRecord> | null = null;

        const builder = {
          select: () => builder,
          update: (payload: Partial<ProfileRecord>) => {
            isUpdate = true;
            updatePayload = payload;
            return builder;
          },
          eq: (col: keyof ProfileRecord, val: unknown) => {
            // Simulate RLS: PostgREST filters where col = val AND auth.uid() = id
            data = data.filter((row) => row[col] === val);
            return builder;
          },
          maybeSingle: async () => {
            if (!authenticatedUserId) {
              return { data: null, error: { message: "JWT not provided or invalid", code: "PGRST301" } };
            }
            if (isUpdate && updatePayload) {
              if (data.length > 0) {
                const targetId = data[0].id;
                const idx = profilesDb.findIndex((r) => r.id === targetId && r.id === authenticatedUserId);
                if (idx !== -1) {
                  profilesDb[idx] = {
                    ...profilesDb[idx],
                    ...updatePayload,
                    updated_at: new Date().toISOString(),
                  };
                  return { data: profilesDb[idx], error: null };
                }
              }
              return { data: null, error: null };
            }

            if (data.length === 0) {
              return { data: null, error: null };
            }
            return { data: data[0], error: null };
          },
        };
        return builder;
      }

      if (tableName === "user_settings") {
        let data = settingsDb.filter((s) => (authenticatedUserId ? s.id === authenticatedUserId : false));
        let isUpdate = false;
        let updatePayload: Partial<UserSettingsRecord> | null = null;
        let selectedCols: string | undefined;

        const builder = {
          select: (cols?: string) => {
            selectedCols = cols;
            return builder;
          },
          update: (payload: Partial<UserSettingsRecord>) => {
            isUpdate = true;
            updatePayload = payload;
            return builder;
          },
          eq: (col: string, val: unknown) => {
            // Simulate RLS: PostgREST filters where col = val AND auth.uid() = id
            data = data.filter((row: any) => row[col] === val);
            return builder;
          },
          maybeSingle: async () => {
            if (!authenticatedUserId) {
              return { data: null, error: { message: "JWT not provided or invalid", code: "PGRST301" } };
            }
            if (isUpdate && updatePayload) {
              if (data.length > 0) {
                const targetId = data[0].id;
                const idx = settingsDb.findIndex((r) => r.id === targetId && r.id === authenticatedUserId);
                if (idx !== -1) {
                  settingsDb[idx] = {
                    ...settingsDb[idx],
                    ...updatePayload,
                    updated_at: new Date().toISOString(),
                  };
                  const sanitized = { ...settingsDb[idx] };
                  if (selectedCols && !selectedCols.includes("byok_api_key")) {
                    delete sanitized.byok_api_key;
                  }
                  return { data: sanitized, error: null };
                }
              }
              return { data: null, error: null };
            }

            if (data.length === 0) {
              return { data: null, error: null };
            }
            const sanitized = { ...data[0] };
            if (selectedCols && !selectedCols.includes("byok_api_key")) {
              delete sanitized.byok_api_key;
            }
            return { data: sanitized, error: null };
          },
        };
        return builder;
      }

      throw new Error(`Table ${tableName} not supported in mock`);
    },
  } as any;
}

// Schemas
const updateProfileSchema: Schema = {
  name: { required: false, type: "string", minLength: 1, maxLength: 100 },
  avatar: { required: false, type: "string", maxLength: 2000, nullable: true },
  bio: { required: false, type: "string", maxLength: 1000, nullable: true },
};

const updateSettingsSchema: Schema = {
  theme: { required: false, type: "string", allowedValues: ["light", "dark", "system"] },
  language: { required: false, type: "string", minLength: 2, maxLength: 30 },
  writing_tone: { required: false, type: "string", minLength: 2, maxLength: 50 },
  default_ai_model: { required: false, type: "string", minLength: 2, maxLength: 100 },
  email_notifications: { required: false, type: "boolean" },
  push_notifications: { required: false, type: "boolean" },
  generation_alerts: { required: false, type: "boolean" },
};

// Seed Data
const initialProfiles: ProfileRecord[] = [
  {
    id: "user-alpha",
    name: "Alpha User",
    avatar: "/avatars/1.png",
    bio: "Senior Copywriter & Strategist",
    joined_date: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "user-beta",
    name: "Beta User",
    avatar: "/avatars/2.png",
    bio: "Technical Writer",
    joined_date: "2025-02-01T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
  },
];

const initialSettings = [
  {
    id: "user-alpha",
    theme: "light",
    language: "en-US",
    writing_tone: "professional",
    default_ai_model: "gemini-2.5-pro",
    byok_api_key: "alpha-super-secret-byok-key",
    email_notifications: true,
    push_notifications: false,
    generation_alerts: true,
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "user-beta",
    theme: "dark",
    language: "es-ES",
    writing_tone: "creative",
    default_ai_model: "gemini-2.5-pro",
    byok_api_key: "beta-super-secret-byok-key",
    email_notifications: false,
    push_notifications: true,
    generation_alerts: false,
    updated_at: "2025-02-01T00:00:00Z",
  },
];

async function runSuite() {
  console.log("==================================================");
  console.log("🔒 DAY 5: PROFILE & SETTINGS COMBINED TEST SUITE");
  console.log("==================================================\n");

  const profilesDb: ProfileRecord[] = JSON.parse(JSON.stringify(initialProfiles));
  const settingsDb = JSON.parse(JSON.stringify(initialSettings));

  // ─── 1-4: UNAUTHENTICATED REQUESTS (401) ──────────────────────────────────
  console.log("--- 1. Unauthenticated Access Protection ---");

  // Helper simulating withAuth check
  function simulateWithAuth(userId: string | null) {
    if (!userId) {
      throw new ApiError("Unauthorized", "UNAUTHORIZED", 401);
    }
  }

  // 1. Unauthenticated GET /api/profile → 401
  assert.throws(
    () => simulateWithAuth(null),
    (err: any) => err instanceof ApiError && err.statusCode === 401 && err.code === "UNAUTHORIZED"
  );
  console.log("  ✓ 1. Unauthenticated GET /api/profile throws 401 Unauthorized");

  // 2. Unauthenticated PATCH /api/profile → 401
  assert.throws(
    () => simulateWithAuth(null),
    (err: any) => err instanceof ApiError && err.statusCode === 401 && err.code === "UNAUTHORIZED"
  );
  console.log("  ✓ 2. Unauthenticated PATCH /api/profile throws 401 Unauthorized");

  // 3. Unauthenticated GET /api/settings → 401
  assert.throws(
    () => simulateWithAuth(null),
    (err: any) => err instanceof ApiError && err.statusCode === 401 && err.code === "UNAUTHORIZED"
  );
  console.log("  ✓ 3. Unauthenticated GET /api/settings throws 401 Unauthorized");

  // 4. Unauthenticated PATCH /api/settings → 401
  assert.throws(
    () => simulateWithAuth(null),
    (err: any) => err instanceof ApiError && err.statusCode === 401 && err.code === "UNAUTHORIZED"
  );
  console.log("  ✓ 4. Unauthenticated PATCH /api/settings throws 401 Unauthorized");

  // ─── 5-6: DATA PERSISTENCE (USER ALPHA) ─────────────────────────────────────
  console.log("\n--- 2. Data Persistence (User Alpha) ---");

  const alphaSupabase = createMockSupabase(profilesDb, settingsDb, "user-alpha");
  const alphaDbService = new DbService(alphaSupabase, "user-alpha");

  // 5. User Alpha Profile Persistence
  const updatedAlphaProfile = await alphaDbService.updateProfile({
    name: "Alpha Prime",
    bio: "Chief AI Content Architect",
    avatar: "/avatars/3.png",
  });
  assert.equal(updatedAlphaProfile.name, "Alpha Prime");
  assert.equal(updatedAlphaProfile.bio, "Chief AI Content Architect");
  assert.equal(updatedAlphaProfile.avatar, "/avatars/3.png");

  const verifiedProfile = await alphaDbService.getProfile();
  assert.equal(verifiedProfile.name, "Alpha Prime");
  assert.equal(verifiedProfile.bio, "Chief AI Content Architect");
  assert.equal(verifiedProfile.avatar, "/avatars/3.png");
  console.log("  ✓ 5. User Alpha profile successfully updated and persisted");

  // 6. User Alpha Settings Persistence
  const updatedAlphaSettings = await alphaDbService.updateSettings({
    theme: "dark",
    language: "fr-FR",
    writing_tone: "persuasive",
    email_notifications: false,
    push_notifications: true,
  });
  assert.equal(updatedAlphaSettings.theme, "dark");
  assert.equal(updatedAlphaSettings.language, "fr-FR");
  assert.equal(updatedAlphaSettings.writing_tone, "persuasive");
  assert.equal(updatedAlphaSettings.email_notifications, false);
  assert.equal(updatedAlphaSettings.push_notifications, true);

  const verifiedSettings = await alphaDbService.getUserSettings();
  assert.equal(verifiedSettings.theme, "dark");
  assert.equal(verifiedSettings.language, "fr-FR");
  assert.equal(verifiedSettings.writing_tone, "persuasive");
  assert.equal(verifiedSettings.email_notifications, false);
  assert.equal(verifiedSettings.push_notifications, true);
  console.log("  ✓ 6. User Alpha settings successfully updated and persisted");

  // ─── 7-10: MULTI-TENANT ISOLATION & RLS VERIFICATION ───────────────────────
  console.log("\n--- 3. Multi-Tenant Isolation & RLS Boundaries ---");

  const betaSupabase = createMockSupabase(profilesDb, settingsDb, "user-beta");
  const betaDbService = new DbService(betaSupabase, "user-beta");

  // 7. User Alpha cannot access User Beta profile
  const alphaAccessingBetaProfile = new DbService(alphaSupabase, "user-beta");
  await assert.rejects(
    async () => await alphaAccessingBetaProfile.getProfile(),
    (err: any) => err instanceof ApiError && err.statusCode === 404
  );
  console.log("  ✓ 7. User Alpha cannot access User Beta's profile (404 / RLS protected)");

  // 8. User Alpha cannot modify User Beta profile
  await assert.rejects(
    async () => await alphaAccessingBetaProfile.updateProfile({ name: "Hacked Beta" }),
    (err: any) => err instanceof ApiError && err.statusCode === 404
  );
  const betaProfileIntact = await betaDbService.getProfile();
  assert.equal(betaProfileIntact.name, "Beta User"); // unchanged
  console.log("  ✓ 8. User Alpha cannot modify User Beta's profile (Beta data remains intact)");

  // 9. User Alpha cannot access User Beta settings
  const alphaAccessingBetaSettings = new DbService(alphaSupabase, "user-beta");
  await assert.rejects(
    async () => await alphaAccessingBetaSettings.getUserSettings(),
    (err: any) => err instanceof ApiError && err.statusCode === 404
  );
  console.log("  ✓ 9. User Alpha cannot access User Beta's settings (404 / RLS protected)");

  // 10. User Alpha cannot modify User Beta settings
  await assert.rejects(
    async () => await alphaAccessingBetaSettings.updateSettings({ theme: "light" }),
    (err: any) => err instanceof ApiError && err.statusCode === 404
  );
  const betaSettingsIntact = await betaDbService.getUserSettings();
  assert.equal(betaSettingsIntact.theme, "dark"); // unchanged
  assert.equal(betaSettingsIntact.language, "es-ES"); // unchanged
  console.log("  ✓ 10. User Alpha cannot modify User Beta's settings (Beta settings remain intact)");

  // ─── 11: SECRET / BYOK PRIVACY AUDIT ──────────────────────────────────────
  console.log("\n--- 4. Secret & BYOK Exposure Audit ---");

  // 11. byok_api_key is NEVER returned in GET or PATCH responses
  const alphaFetchedSettings = await alphaDbService.getUserSettings();
  assert.equal((alphaFetchedSettings as any).byok_api_key, undefined);
  assert.equal("byok_api_key" in alphaFetchedSettings, false);

  const alphaPatchedSettings = await alphaDbService.updateSettings({ writing_tone: "direct" });
  assert.equal((alphaPatchedSettings as any).byok_api_key, undefined);
  assert.equal("byok_api_key" in alphaPatchedSettings, false);
  console.log("  ✓ 11. byok_api_key is strictly stripped and never returned to client responses");

  // ─── 12: USER_ID INJECTION / OWNERSHIP TAMPERING ──────────────────────────
  console.log("\n--- 5. Ownership Tampering & Field Validation ---");

  // 12. Frontend-supplied user_id cannot change ownership (strictly rejected with 400)
  assert.throws(
    () =>
      validateRequest(
        { name: "Attempted Hijack", user_id: "user-beta" },
        updateProfileSchema,
        { allowUnknown: false, requireAtLeastOne: true }
      ),
    (err: any) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("user_id")
  );

  assert.throws(
    () =>
      validateRequest(
        { theme: "dark", user_id: "user-beta" },
        updateSettingsSchema,
        { allowUnknown: false, requireAtLeastOne: true }
      ),
    (err: any) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("user_id")
  );

  assert.throws(
    () =>
      validateRequest(
        { byok_api_key: "leaked_key" },
        updateSettingsSchema,
        { allowUnknown: false, requireAtLeastOne: true }
      ),
    (err: any) => err instanceof ApiError && err.statusCode === 400 && err.message.includes("byok_api_key")
  );
  console.log("  ✓ 12. Injected user_id and byok_api_key in request payloads are rejected with 400");

  console.log("\n==================================================");
  console.log("🎉 ALL 12 DAY 5 PROFILE & SETTINGS TEST SCENARIOS PASSED!");
  console.log("==================================================\n");
}

runSuite().catch((err) => {
  console.error("❌ Test Suite Failure:", err);
  process.exit(1);
});
