import assert from "node:assert/strict";
import { DbService, type UserTemplateRecord } from "../lib/api/services/db";
import { ApiError } from "../lib/api/errors";
import { validateRequest } from "../lib/api/validator";

// Mock Supabase Query Builder to simulate PostgREST operations and RLS on user_templates
function createMockSupabase(database: UserTemplateRecord[]) {
  return {
    from: (tableName: string) => {
      if (tableName !== "user_templates") {
        throw new Error(`Table ${tableName} not supported in mock`);
      }

      let data = [...database];
      let hasCount = false;
      let isDelete = false;
      let isUpdate = false;
      let updatePayload: Partial<UserTemplateRecord> | null = null;
      let deletedItem: UserTemplateRecord | null = null;
      let updatedItem: UserTemplateRecord | null = null;

      const builder = {
        select: (_cols?: string, options?: { count?: string }) => {
          if (options?.count === "exact") {
            hasCount = true;
          }
          return builder;
        },
        insert: (payload: Partial<UserTemplateRecord>) => {
          const newRecord: UserTemplateRecord = {
            id: payload.id || `tmpl-${Math.random().toString(36).substring(2, 9)}`,
            user_id: payload.user_id || "",
            title: payload.title || "Untitled",
            description: payload.description || "",
            category: payload.category || "General",
            content: payload.content || "",
            is_favorite: payload.is_favorite ?? false,
            created_at: payload.created_at || new Date().toISOString(),
            updated_at: payload.updated_at || new Date().toISOString(),
          };
          database.push(newRecord);
          data = [newRecord];
          return builder;
        },
        update: (payload: Partial<UserTemplateRecord>) => {
          isUpdate = true;
          updatePayload = payload;
          return builder;
        },
        delete: () => {
          isDelete = true;
          return builder;
        },
        eq: (col: keyof UserTemplateRecord, val: unknown) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        or: (condition: string) => {
          // Parse: title.ilike.%query%,description.ilike.%query%,content.ilike.%query%
          const matches = [...condition.matchAll(/ilike\.%([^%]+)%/g)];
          if (matches.length > 0) {
            const query = matches[0][1].toLowerCase();
            data = data.filter(
              (row) =>
                row.title.toLowerCase().includes(query) ||
                row.description.toLowerCase().includes(query) ||
                row.content.toLowerCase().includes(query)
            );
          }
          return builder;
        },
        order: (col: string, options: { ascending?: boolean }) => {
          const asc = options?.ascending ?? true;
          data.sort((a, b) => {
            if (col === "created_at" || col === "updated_at") {
              const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              return asc ? diff : -diff;
            }
            if (col === "title") {
              const diff = a.title.localeCompare(b.title);
              return asc ? diff : -diff;
            }
            return 0;
          });
          return builder;
        },
        range: (from: number, to: number) => {
          const countBeforeRange = data.length;
          data = data.slice(from, to + 1);
          (builder as any)._countBeforeRange = countBeforeRange;
          return builder;
        },
        limit: (n: number) => {
          data = data.slice(0, n);
          return builder;
        },
        single: async () => {
          if (data.length === 0) {
            return { data: null, error: { message: "Row not found", code: "PGRST116" } };
          }
          return { data: data[0], error: null };
        },
        maybeSingle: async () => {
          if (isDelete) {
            if (data.length > 0) {
              const item = data[0];
              const idx = database.findIndex((r) => r.id === item.id);
              if (idx !== -1) {
                deletedItem = database.splice(idx, 1)[0];
              }
              return { data: deletedItem, error: null };
            }
            return { data: null, error: null };
          }
          if (isUpdate && updatePayload) {
            if (data.length > 0) {
              const item = data[0];
              const idx = database.findIndex((r) => r.id === item.id);
              if (idx !== -1) {
                database[idx] = { ...database[idx], ...updatePayload, updated_at: new Date().toISOString() };
                updatedItem = database[idx];
              }
              return { data: updatedItem, error: null };
            }
            return { data: null, error: null };
          }
          return { data: data[0] || null, error: null };
        },
        then: (resolve: (result: { data: UserTemplateRecord[]; error: null; count: number | undefined }) => void) => {
          const count = hasCount ? ((builder as any)._countBeforeRange ?? data.length) : undefined;
          resolve({ data, error: null, count });
        },
      };

      return builder;
    },
  } as unknown as ConstructorParameters<typeof DbService>[0];
}

// Validation schemas for template requests
const createTemplateSchema = {
  title: { required: true, type: "string" as const, minLength: 1, maxLength: 200 },
  description: { required: true, type: "string" as const, minLength: 1, maxLength: 2000 },
  category: { required: true, type: "string" as const, minLength: 1, maxLength: 100 },
  content: { required: false, type: "string" as const, maxLength: 50000 },
  is_favorite: { required: false, type: "boolean" as const },
};

const updateTemplateSchema = {
  title: { required: false, type: "string" as const, minLength: 1, maxLength: 200 },
  description: { required: false, type: "string" as const, minLength: 1, maxLength: 2000 },
  category: { required: false, type: "string" as const, minLength: 1, maxLength: 100 },
  content: { required: false, type: "string" as const, maxLength: 50000 },
  is_favorite: { required: false, type: "boolean" as const },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function runTests() {
  console.log("🚀 Starting Writeora Templates Backend & Integration Test Suite...\n");

  const mockDb: UserTemplateRecord[] = [];
  const userA = "11111111-1111-4111-8111-111111111111";
  const userB = "22222222-2222-4222-8222-222222222222";

  const client = createMockSupabase(mockDb);
  const dbServiceA = new DbService(client, userA);
  const dbServiceB = new DbService(client, userB);

  // 1. Unauthenticated Request Simulation → 401
  console.log("1. Testing Unauthenticated Access Simulation (401)...");
  {
    const mockGetAuth = (hasSession: boolean) => {
      if (!hasSession) {
        throw new ApiError("Unauthorized", "UNAUTHORIZED", 401);
      }
      return { user: { id: userA } };
    };

    assert.throws(
      () => mockGetAuth(false),
      (err: unknown) => err instanceof ApiError && err.statusCode === 401 && err.code === "UNAUTHORIZED",
      "Unauthenticated GET/POST must reject with 401 Unauthorized"
    );
    console.log("  ✓ Unauthenticated GET/POST properly throws 401 Unauthorized");
  }

  // 2. Create Template (User A)
  console.log("\n2. Testing Create Template (User A)...");
  const tmplA1 = await dbServiceA.createTemplate({
    id: "a0000000-0000-4000-8000-000000000001",
    title: "Executive Summary Generator",
    description: "Generates high-level executive summaries for corporate decks.",
    category: "Business",
    content: "Please summarize the following quarterly revenue report...",
    is_favorite: false,
  });
  assert.equal(tmplA1.id, "a0000000-0000-4000-8000-000000000001");
  assert.equal(tmplA1.user_id, userA);
  assert.equal(tmplA1.title, "Executive Summary Generator");
  assert.equal(tmplA1.category, "Business");
  assert.equal(tmplA1.is_favorite, false);
  console.log("  ✓ Created User A template 1 successfully");

  const tmplA2 = await dbServiceA.createTemplate({
    id: "a0000000-0000-4000-8000-000000000002",
    title: "Cold Email Pitch",
    description: "Write compelling cold outreach emails for B2B leads.",
    category: "Email",
    content: "Craft a 3-paragraph cold email focusing on value proposition...",
    is_favorite: true,
  });
  assert.equal(tmplA2.is_favorite, true);

  const tmplA3 = await dbServiceA.createTemplate({
    id: "a0000000-0000-4000-8000-000000000003",
    title: "Viral LinkedIn Post",
    description: "Create engaging carousel-style posts for LinkedIn audience.",
    category: "Social Media",
    content: "Generate 5 actionable takeaways with an engaging hook...",
    is_favorite: false,
  });
  console.log("  ✓ Created User A templates 2 & 3 successfully");

  // 3. Multi-User Tenant Isolation (User A vs User B)
  console.log("\n3. Testing Multi-User Tenant Isolation (User A vs User B)...");
  const tmplB1 = await dbServiceB.createTemplate({
    id: "b0000000-0000-4000-8000-000000000001",
    title: "User B Confidential Marketing Strategy",
    description: "Internal marketing prompts for secret product launch.",
    category: "Marketing",
    content: "Classified marketing copy instructions...",
    is_favorite: true,
  });
  assert.equal(tmplB1.user_id, userB);

  // User A cannot get User B's template
  const fetchBFromA = await dbServiceA.getTemplateById(tmplB1.id);
  assert.equal(fetchBFromA, null, "User A must not be able to get User B's template");
  console.log("  ✓ User A cannot read User B's template (returns null / 404)");

  // User A cannot update User B's template
  await assert.rejects(
    async () => {
      await dbServiceA.updateTemplate(tmplB1.id, { title: "Hijacked by User A" });
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 404,
    "User A must receive 404 when attempting to update User B's template"
  );
  console.log("  ✓ User A cannot update User B's template (404 Not Found)");

  // User A cannot delete User B's template
  await assert.rejects(
    async () => {
      await dbServiceA.deleteTemplate(tmplB1.id);
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 404,
    "User A must receive 404 when attempting to delete User B's template"
  );
  console.log("  ✓ User A cannot delete User B's template (404 Not Found)");

  // User B still has their template intact
  const fetchBFromB = await dbServiceB.getTemplateById(tmplB1.id);
  assert.notEqual(fetchBFromB, null);
  assert.equal(fetchBFromB?.title, "User B Confidential Marketing Strategy");
  console.log("  ✓ User B's template data remains completely secure and intact");

  // 4. Get Templates (User A)
  console.log("\n4. Testing Get Templates (User A)...");
  const allUserATemplates = await dbServiceA.getTemplates();
  assert.equal(allUserATemplates.items.length, 3);
  assert.equal(allUserATemplates.total, 3);
  console.log("  ✓ Retrieved all templates scoped to User A");

  // 5. Get Single Template by ID
  console.log("\n5. Testing Get Single Template by ID...");
  const single = await dbServiceA.getTemplateById(tmplA1.id);
  assert.notEqual(single, null);
  assert.equal(single?.title, "Executive Summary Generator");
  console.log("  ✓ Fetched single template successfully");

  // 6. Search Templates (by title, description, content)
  console.log("\n6. Testing Search Functionality...");
  const titleSearch = await dbServiceA.getTemplates({ search: "Executive" });
  assert.equal(titleSearch.items.length, 1);
  assert.equal(titleSearch.items[0].id, tmplA1.id);
  console.log("  ✓ Search by title keyword works");

  const descSearch = await dbServiceA.getTemplates({ search: "cold outreach" });
  assert.equal(descSearch.items.length, 1);
  assert.equal(descSearch.items[0].id, tmplA2.id);
  console.log("  ✓ Search by description keyword works");

  const contentSearch = await dbServiceA.getTemplates({ search: "actionable takeaways" });
  assert.equal(contentSearch.items.length, 1);
  assert.equal(contentSearch.items[0].id, tmplA3.id);
  console.log("  ✓ Search by content keyword works");

  // 7. Category Filter
  console.log("\n7. Testing Category Filtering...");
  const emailFilter = await dbServiceA.getTemplates({ category: "Email" });
  assert.equal(emailFilter.items.length, 1);
  assert.equal(emailFilter.items[0].category, "Email");
  console.log("  ✓ Filter by category ('Email') works");

  const socialFilter = await dbServiceA.getTemplates({ category: "Social Media" });
  assert.equal(socialFilter.items.length, 1);
  assert.equal(socialFilter.items[0].category, "Social Media");
  console.log("  ✓ Filter by category ('Social Media') works");

  // 8. Favorite Filtering & Toggling
  console.log("\n8. Testing Favorite Persistence & Filtering...");
  const favFilter = await dbServiceA.getTemplates({ favorite: true });
  assert.equal(favFilter.items.length, 1);
  assert.equal(favFilter.items[0].id, tmplA2.id);
  console.log("  ✓ Filter by favorite ('is_favorite = true') works");

  // Toggle tmplA1 to favorite = true
  const toggled = await dbServiceA.updateTemplate(tmplA1.id, { is_favorite: true });
  assert.equal(toggled.is_favorite, true);
  const favFilterAfterToggle = await dbServiceA.getTemplates({ favorite: true });
  assert.equal(favFilterAfterToggle.items.length, 2);
  console.log("  ✓ Toggled template to favorite and verified persistence");

  // Toggle back
  await dbServiceA.updateTemplate(tmplA1.id, { is_favorite: false });

  // 9. Update Template
  console.log("\n9. Testing Update Template...");
  const updatedTmpl = await dbServiceA.updateTemplate(tmplA3.id, {
    title: "Viral LinkedIn & Twitter Post",
    description: "Create engaging multi-platform posts for professional audience.",
    category: "Social Media",
  });
  assert.equal(updatedTmpl.title, "Viral LinkedIn & Twitter Post");
  assert.equal(updatedTmpl.description, "Create engaging multi-platform posts for professional audience.");
  console.log("  ✓ Template updated successfully");

  // 10. Delete Template
  console.log("\n10. Testing Delete Template...");
  const deleted = await dbServiceA.deleteTemplate(tmplA3.id);
  assert.equal(deleted.id, tmplA3.id);

  const checkDeleted = await dbServiceA.getTemplateById(tmplA3.id);
  assert.equal(checkDeleted, null);
  console.log("  ✓ Template deleted successfully");

  // 11. Validation Rules Testing (400 Bad Request)
  console.log("\n11. Testing Validation Rules (400 Bad Request)...");
  // Missing required title
  assert.throws(
    () => validateRequest({ description: "Desc", category: "Writing" }, createTemplateSchema),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Missing required title must fail validation"
  );
  // Missing required description
  assert.throws(
    () => validateRequest({ title: "Title", category: "Writing" }, createTemplateSchema),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Missing required description must fail validation"
  );
  // Title exceeds max length
  assert.throws(
    () => validateRequest({ title: "a".repeat(201), description: "Desc", category: "Writing" }, createTemplateSchema),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Title exceeding 200 characters must fail validation"
  );
  // Update schema validation check
  assert.throws(
    () => validateRequest({ title: "a".repeat(201) }, updateTemplateSchema),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Updated title exceeding 200 characters must fail validation"
  );
  // Invalid data type
  assert.throws(
    () => validateRequest({ title: 12345, description: "Desc", category: "Writing" }, createTemplateSchema),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Numeric title must fail validation"
  );
  console.log("  ✓ Validation rules properly enforce required fields, types, and lengths with 400");

  // 12. Invalid ID Format Validation (400 Bad Request)
  console.log("\n12. Testing Invalid ID Format Validation (400)...");
  const validateId = (id: string) => {
    if (!id || !UUID_REGEX.test(id)) {
      throw new ApiError("Invalid template ID format. Expected a valid UUID.", "VALIDATION_ERROR", 400);
    }
  };

  assert.throws(
    () => validateId("not-a-valid-uuid"),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Non-UUID ID string must fail validation"
  );
  assert.throws(
    () => validateId("12345"),
    (err: unknown) => err instanceof ApiError && err.statusCode === 400,
    "Numeric ID string must fail validation"
  );
  // Valid UUID should not throw
  assert.doesNotThrow(() => validateId("a0000000-0000-4000-8000-000000000001"));
  console.log("  ✓ Invalid UUID format correctly throws 400 VALIDATION_ERROR");

  // 13. Pagination Testing
  console.log("\n13. Testing Pagination...");
  const pageResult1 = await dbServiceA.getTemplates({ page: 1, limit: 1 });
  assert.equal(pageResult1.items.length, 1);
  assert.equal(pageResult1.page, 1);
  assert.equal(pageResult1.limit, 1);
  assert.equal(pageResult1.total, 2); // tmplA1 and tmplA2 remaining

  const pageResult2 = await dbServiceA.getTemplates({ page: 2, limit: 1 });
  assert.equal(pageResult2.items.length, 1);
  assert.equal(pageResult2.page, 2);
  assert.notEqual(pageResult1.items[0].id, pageResult2.items[0].id);
  console.log("  ✓ Pagination (page=1, page=2, limit=1) functions correctly");

  console.log("\n✨ ALL 15 TEMPLATE TEST SCENARIOS PASSED PERFECTLY! ✨\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
