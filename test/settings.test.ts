import assert from "node:assert/strict";
import { DbService, type UserSettingsRecord } from "../lib/api/services/db";
import { ApiError } from "../lib/api/errors";
import { validateRequest, type Schema } from "../lib/api/validator";

// Mock Supabase Query Builder to simulate PostgREST operations and RLS on user_settings
function createMockSupabase(database: (UserSettingsRecord & { byok_api_key?: string | null })[]) {
  return {
    from: (tableName: string) => {
      if (tableName !== "user_settings") {
        throw new Error(`Table ${tableName} not supported in mock`);
      }

      let data = [...database];
      let isUpdate = false;
      let updatePayload: Partial<UserSettingsRecord> | null = null;
      let selectedCols: string | undefined;

      const builder = {
        select: (cols?: string) => {
          selectedCols = cols;
          return builder;
        },
        insert: (payload: Partial<UserSettingsRecord>) => {
          const newRecord = {
            id: payload.id || `usr-${Math.random().toString(36).substring(2, 9)}`,
            theme: payload.theme || "light",
            language: payload.language || "en-US",
            writing_tone: payload.writing_tone || "professional",
            default_ai_model: payload.default_ai_model || "gemini-2.5-pro",
            byok_api_key: (payload as any).byok_api_key ?? null,
            email_notifications: payload.email_notifications ?? true,
            push_notifications: payload.push_notifications ?? false,
            generation_alerts: payload.generation_alerts ?? true,
            updated_at: payload.updated_at || new Date().toISOString(),
          };
          database.push(newRecord);
          data = [newRecord];
          return builder;
        },
        update: (payload: Partial<UserSettingsRecord>) => {
          isUpdate = true;
          updatePayload = payload;
          return builder;
        },
        eq: (col: string, val: unknown) => {
          data = data.filter((row: any) => row[col] === val);
          return builder;
        },
        maybeSingle: async () => {
          if (isUpdate && updatePayload) {
            if (data.length > 0) {
              const item = data[0];
              const idx = database.findIndex((r) => r.id === item.id);
              if (idx !== -1) {
                database[idx] = {
                  ...database[idx],
                  ...updatePayload,
                  updated_at: new Date().toISOString(),
                };
                const sanitized = { ...database[idx] };
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
    },
  } as any;
}

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

// Seed Data
const initialSettings = [
  {
    id: "user-1",
    theme: "light",
    language: "en-US",
    writing_tone: "professional",
    default_ai_model: "gemini-2.5-pro",
    byok_api_key: "secret-key-user-1",
    email_notifications: true,
    push_notifications: false,
    generation_alerts: true,
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    theme: "dark",
    language: "es-ES",
    writing_tone: "casual",
    default_ai_model: "gemini-2.5-pro",
    byok_api_key: "secret-key-user-2",
    email_notifications: false,
    push_notifications: true,
    generation_alerts: false,
    updated_at: "2025-02-20T12:00:00Z",
  },
];

async function runTests() {
  console.log("🚀 Starting Settings Backend & Security Tests...\n");

  const db = JSON.parse(JSON.stringify(initialSettings));
  const supabase = createMockSupabase(db);

  // 1. GET Settings - Authenticated User
  console.log("1. GET /api/settings - Fetch existing user settings");
  {
    const dbService = new DbService(supabase, "user-1");
    const settings = await dbService.getUserSettings();
    assert.equal(settings.id, "user-1");
    assert.equal(settings.theme, "light");
    assert.equal(settings.language, "en-US");
    assert.equal(settings.writing_tone, "professional");
    assert.equal(settings.email_notifications, true);
    assert.equal(settings.push_notifications, false);
    assert.equal(settings.generation_alerts, true);
    // Security check: byok_api_key must NEVER be exposed
    assert.equal((settings as any).byok_api_key, undefined);
    console.log("   ✅ Successfully retrieved settings without exposing byok_api_key");
  }

  // 2. GET Settings - Not Found
  console.log("2. GET /api/settings - Settings not found error handling");
  {
    const dbService = new DbService(supabase, "non-existent-user");
    await assert.rejects(
      async () => await dbService.getUserSettings(),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 404);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      }
    );
    console.log("   ✅ Returns 404 NOT_FOUND when settings row is missing");
  }

  // 3. User Isolation - Database queries scoped strictly to authenticated user
  console.log("3. User Isolation - Settings queries scoped to authenticated userId");
  {
    const user1Service = new DbService(supabase, "user-1");
    const user2Service = new DbService(supabase, "user-2");

    const s1 = await user1Service.getUserSettings();
    const s2 = await user2Service.getUserSettings();

    assert.equal(s1.theme, "light");
    assert.equal(s1.language, "en-US");
    assert.equal(s2.theme, "dark");
    assert.equal(s2.language, "es-ES");
    assert.notEqual(s1.id, s2.id);
    console.log("   ✅ User settings are strictly isolated between accounts");
  }

  // 4. PATCH Settings - Update Theme and Language
  console.log("4. PATCH /api/settings - Update theme and language");
  {
    const dbService = new DbService(supabase, "user-1");
    const updated = await dbService.updateSettings({
      theme: "dark",
      language: "fr-FR",
    });

    assert.equal(updated.theme, "dark");
    assert.equal(updated.language, "fr-FR");
    assert.equal(updated.writing_tone, "professional"); // unchanged
    assert.equal((updated as any).byok_api_key, undefined); // security

    const refreshed = await dbService.getUserSettings();
    assert.equal(refreshed.theme, "dark");
    assert.equal(refreshed.language, "fr-FR");
    console.log("   ✅ Successfully updated theme and language, confirmed persistence");
  }

  // 5. PATCH Settings - Update Notification Toggles
  console.log("5. PATCH /api/settings - Update notification preferences");
  {
    const dbService = new DbService(supabase, "user-1");
    const updated = await dbService.updateSettings({
      email_notifications: false,
      push_notifications: true,
      generation_alerts: false,
    });

    assert.equal(updated.email_notifications, false);
    assert.equal(updated.push_notifications, true);
    assert.equal(updated.generation_alerts, false);
    console.log("   ✅ Successfully updated all notification flags");
  }

  // 6. PATCH Settings - Not Found Error
  console.log("6. PATCH /api/settings - Target user not found error");
  {
    const dbService = new DbService(supabase, "non-existent-user");
    await assert.rejects(
      async () => await dbService.updateSettings({ theme: "dark" }),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
    console.log("   ✅ Returns 404 NOT_FOUND when updating non-existent user settings");
  }

  // 7. Validation - Rejects Unexpected Fields (e.g. user_id, id, byok_api_key)
  console.log("7. Validation - Strictly reject unexpected fields and byok_api_key");
  {
    // Reject user_id injection
    assert.throws(
      () =>
        validateRequest(
          { theme: "dark", user_id: "user-2" },
          updateSettingsSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert(err.message.includes("Unexpected field 'user_id'"));
        return true;
      }
    );

    // Reject byok_api_key from frontend
    assert.throws(
      () =>
        validateRequest(
          { theme: "dark", byok_api_key: "exposed-key" },
          updateSettingsSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("Unexpected field 'byok_api_key'"));
        return true;
      }
    );
    console.log("   ✅ Disallowed fields (user_id, byok_api_key) are rejected with 400");
  }

  // 8. Validation - Theme allowed values
  console.log("8. Validation - Allowed values for theme");
  {
    assert.throws(
      () =>
        validateRequest(
          { theme: "neon-cyberpunk" },
          updateSettingsSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("must be one of: light, dark, system"));
        return true;
      }
    );
    console.log("   ✅ Invalid theme value rejected with 400");
  }

  // 9. Validation - Notification values must be booleans
  console.log("9. Validation - Notification boolean types");
  {
    assert.throws(
      () =>
        validateRequest(
          { email_notifications: "yes" as any },
          updateSettingsSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("must be of type boolean"));
        return true;
      }
    );
    console.log("   ✅ Non-boolean notification value rejected with 400");
  }

  // 10. Validation - Require at least one field
  console.log("10. Validation - Require at least one field");
  {
    assert.throws(
      () =>
        validateRequest({}, updateSettingsSchema, {
          allowUnknown: false,
          requireAtLeastOne: true,
        }),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        return true;
      }
    );
    console.log("   ✅ Empty PATCH payload rejected with 400");
  }

  console.log("\n🎉 ALL Settings Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
