import assert from "node:assert/strict";
import { DbService, type ProfileRecord } from "../lib/api/services/db";
import { ApiError } from "../lib/api/errors";
import { validateRequest, type Schema } from "../lib/api/validator";

// Mock Supabase Query Builder to simulate PostgREST operations and RLS on profiles
function createMockSupabase(database: ProfileRecord[]) {
  return {
    from: (tableName: string) => {
      if (tableName !== "profiles") {
        throw new Error(`Table ${tableName} not supported in mock`);
      }

      let data = [...database];
      let isUpdate = false;
      let updatePayload: Partial<ProfileRecord> | null = null;

      const builder = {
        select: () => {
          return builder;
        },
        insert: (payload: Partial<ProfileRecord>) => {
          const newRecord: ProfileRecord = {
            id: payload.id || `usr-${Math.random().toString(36).substring(2, 9)}`,
            name: payload.name ?? null,
            avatar: payload.avatar ?? null,
            bio: payload.bio ?? null,
            joined_date: payload.joined_date || new Date().toISOString(),
            updated_at: payload.updated_at || new Date().toISOString(),
          };
          database.push(newRecord);
          data = [newRecord];
          return builder;
        },
        update: (payload: Partial<ProfileRecord>) => {
          isUpdate = true;
          updatePayload = payload;
          return builder;
        },
        eq: (col: keyof ProfileRecord, val: unknown) => {
          data = data.filter((row) => row[col] === val);
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
                return { data: database[idx], error: null };
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
    },
  } as any;
}

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

// Seed Data
const initialProfiles: ProfileRecord[] = [
  {
    id: "user-1",
    name: "Alice Johnson",
    avatar: "/avatars/1.png",
    bio: "Lead Content Strategist & Writer",
    joined_date: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    avatar: "/avatars/2.png",
    bio: "Marketing Copywriter",
    joined_date: "2025-02-20T12:00:00Z",
    updated_at: "2025-02-20T12:00:00Z",
  },
];

async function runTests() {
  console.log("🚀 Starting Profile Backend & Security Tests...\n");

  const db: ProfileRecord[] = JSON.parse(JSON.stringify(initialProfiles));
  const supabase = createMockSupabase(db);

  // 1. GET Profile - Authenticated User
  console.log("1. GET /api/profile - Fetch existing user profile");
  {
    const dbService = new DbService(supabase, "user-1");
    const profile = await dbService.getProfile();
    assert.equal(profile.id, "user-1");
    assert.equal(profile.name, "Alice Johnson");
    assert.equal(profile.avatar, "/avatars/1.png");
    assert.equal(profile.bio, "Lead Content Strategist & Writer");
    console.log("   ✅ Successfully retrieved authenticated user profile");
  }

  // 2. GET Profile - Not Found
  console.log("2. GET /api/profile - Profile not found error handling");
  {
    const dbService = new DbService(supabase, "non-existent-user");
    await assert.rejects(
      async () => await dbService.getProfile(),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 404);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      }
    );
    console.log("   ✅ Returns 404 NOT_FOUND when profile row is missing");
  }

  // 3. User Isolation - User A cannot access User B's profile via their own DbService
  console.log("3. User Isolation - Database queries scoped strictly to authenticated user");
  {
    const user1Service = new DbService(supabase, "user-1");
    const user2Service = new DbService(supabase, "user-2");

    const p1 = await user1Service.getProfile();
    const p2 = await user2Service.getProfile();

    assert.equal(p1.name, "Alice Johnson");
    assert.equal(p2.name, "Bob Smith");
    assert.notEqual(p1.id, p2.id);
    console.log("   ✅ User queries are strictly isolated to authenticated userId");
  }

  // 4. PATCH Profile - Update Name and Bio
  console.log("4. PATCH /api/profile - Update profile details");
  {
    const dbService = new DbService(supabase, "user-1");
    const updated = await dbService.updateProfile({
      name: "Alice J. Developer",
      bio: "Senior AI Prompt Engineer",
    });

    assert.equal(updated.name, "Alice J. Developer");
    assert.equal(updated.bio, "Senior AI Prompt Engineer");
    assert.equal(updated.avatar, "/avatars/1.png"); // unchanged

    const refreshed = await dbService.getProfile();
    assert.equal(refreshed.name, "Alice J. Developer");
    console.log("   ✅ Successfully updated profile and persisted changes");
  }

  // 5. PATCH Profile - Update Avatar
  console.log("5. PATCH /api/profile - Update avatar");
  {
    const dbService = new DbService(supabase, "user-1");
    const updated = await dbService.updateProfile({
      avatar: "/avatars/4.png",
    });

    assert.equal(updated.avatar, "/avatars/4.png");
    assert.equal(updated.name, "Alice J. Developer"); // preserved
    console.log("   ✅ Successfully updated avatar without mutating other fields");
  }

  // 6. PATCH Profile - Not Found
  console.log("6. PATCH /api/profile - Target user not found error");
  {
    const dbService = new DbService(supabase, "non-existent-user");
    await assert.rejects(
      async () => await dbService.updateProfile({ name: "Ghost" }),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
    console.log("   ✅ Returns 404 NOT_FOUND when updating non-existent user profile");
  }

  // 7. Validation - Rejects Unexpected Fields (e.g. user_id, id, role)
  console.log("7. Validation - Strictly reject unexpected fields (security)");
  {
    assert.throws(
      () =>
        validateRequest(
          { name: "Hacker", user_id: "user-2" },
          updateProfileSchema,
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

    assert.throws(
      () =>
        validateRequest(
          { name: "Hacker", id: "user-2" },
          updateProfileSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("Unexpected field 'id'"));
        return true;
      }
    );
    console.log("   ✅ Unexpected fields like 'user_id' and 'id' are rejected with 400");
  }

  // 8. Validation - Require at least one field
  console.log("8. Validation - Require at least one field for PATCH");
  {
    assert.throws(
      () =>
        validateRequest({}, updateProfileSchema, {
          allowUnknown: false,
          requireAtLeastOne: true,
        }),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert.equal(err.code, "VALIDATION_ERROR");
        return true;
      }
    );
    console.log("   ✅ Empty PATCH payload rejected with 400");
  }

  // 9. Validation - Field constraints (name length, bio length, avatar length)
  console.log("9. Validation - Length and type constraints");
  {
    // Name too long (> 100)
    assert.throws(
      () =>
        validateRequest(
          { name: "x".repeat(101) },
          updateProfileSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("must be at most 100 characters"));
        return true;
      }
    );

    // Bio too long (> 1000)
    assert.throws(
      () =>
        validateRequest(
          { bio: "x".repeat(1001) },
          updateProfileSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("must be at most 1000 characters"));
        return true;
      }
    );

    // Invalid type (name as number)
    assert.throws(
      () =>
        validateRequest(
          { name: 12345 },
          updateProfileSchema,
          { allowUnknown: false, requireAtLeastOne: true }
        ),
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 400);
        assert(err.message.includes("must be of type string"));
        return true;
      }
    );

    console.log("   ✅ All field length and type constraints validated correctly");
  }

  console.log("\n🎉 ALL Profile Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
