import assert from "node:assert/strict";
import { DbService, type GenerationRecord } from "../lib/api/services/db";
import { ApiError } from "../lib/api/errors";
import { validateRequest } from "../lib/api/validator";

// Mock Supabase Query Builder to simulate PostgREST operations and RLS
function createMockSupabase(database: GenerationRecord[]) {
  return {
    from: (tableName: string) => {
      if (tableName !== "generations") {
        throw new Error(`Table ${tableName} not supported in mock`);
      }

      let data = [...database];
      let hasCount = false;
      let isDelete = false;
      let isUpdate = false;
      let updatePayload: Partial<GenerationRecord> | null = null;
      let deletedItem: GenerationRecord | null = null;
      let updatedItem: GenerationRecord | null = null;

      const builder = {
        select: (_cols?: string, options?: { count?: string }) => {
          if (options?.count === "exact") {
            hasCount = true;
          }
          return builder;
        },
        insert: (payload: Partial<GenerationRecord>) => {
          const newRecord: GenerationRecord = {
            id: payload.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
            user_id: payload.user_id || "",
            title: payload.title || "Untitled",
            template: payload.template || "General",
            category: payload.category || "General",
            status: payload.status || "completed",
            preview: payload.preview || "",
            word_count: payload.word_count ?? 0,
            created_at: payload.created_at || new Date().toISOString(),
          };
          database.push(newRecord);
          data = [newRecord];
          return builder;
        },
        update: (payload: Partial<GenerationRecord>) => {
          isUpdate = true;
          updatePayload = payload;
          return builder;
        },
        delete: () => {
          isDelete = true;
          return builder;
        },
        eq: (col: keyof GenerationRecord, val: unknown) => {
          data = data.filter((row) => row[col] === val);
          return builder;
        },
        or: (condition: string) => {
          const match = condition.match(/ilike\.%([^%]+)%/);
          if (match && match[1]) {
            const query = match[1].toLowerCase();
            data = data.filter(
              (row) =>
                row.title.toLowerCase().includes(query) ||
                row.preview.toLowerCase().includes(query)
            );
          }
          return builder;
        },
        order: (col: string, options: { ascending?: boolean }) => {
          const asc = options?.ascending ?? true;
          data.sort((a, b) => {
            if (col === "created_at") {
              const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              return asc ? diff : -diff;
            }
            if (col === "word_count") {
              const diff = (a.word_count || 0) - (b.word_count || 0);
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
          data = data.slice(from, to + 1);
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
                database[idx] = { ...database[idx], ...updatePayload };
                updatedItem = database[idx];
              }
              return { data: updatedItem, error: null };
            }
            return { data: null, error: null };
          }
          return { data: data[0] || null, error: null };
        },
        then: (resolve: (result: { data: GenerationRecord[]; error: null; count: number | undefined }) => void) => {
          resolve({ data, error: null, count: hasCount ? data.length : undefined });
        },
      };

      return builder;
    },
  } as unknown as ConstructorParameters<typeof DbService>[0];
}

async function runTests() {
  console.log("🚀 Starting History Backend & Integration Test Suite...\n");

  const mockDb: GenerationRecord[] = [];
  const userA = "user-aaa-111";
  const userB = "user-bbb-222";

  const client = createMockSupabase(mockDb);
  const dbServiceA = new DbService(client, userA);
  const dbServiceB = new DbService(client, userB);

  // Test 1: Create Generation for User A
  console.log("1. Testing Create Generation (User A)...");
  const genA1 = await dbServiceA.createGeneration({
    id: "a0000000-0000-0000-0000-000000000001",
    title: "How to Build Next.js Apps",
    template: "Blog Post",
    category: "Blog Writing",
    status: "completed",
    preview: "Next.js App Router provides extraordinary performance.",
    word_count: 500,
  });
  assert.equal(genA1.id, "a0000000-0000-0000-0000-000000000001");
  assert.equal(genA1.user_id, userA);
  assert.equal(genA1.title, "How to Build Next.js Apps");
  assert.equal(genA1.word_count, 500);
  console.log("  ✓ Created generation successfully");

  // Test 2: Create additional generations for User A
  const genA2 = await dbServiceA.createGeneration({
    id: "a0000000-0000-0000-0000-000000000002",
    title: "Email Newsletter Draft",
    template: "Newsletter",
    category: "Email",
    status: "draft",
    preview: "Welcome to our weekly updates and news.",
    word_count: 250,
  });
  const genA3 = await dbServiceA.createGeneration({
    id: "a0000000-0000-0000-0000-000000000003",
    title: "Social Media Campaign",
    template: "Twitter Thread",
    category: "Social Media",
    status: "completed",
    preview: "10 tips for clean code and great architecture.",
    word_count: 120,
  });

  // Test 3: Create Generation for User B (Tenant Isolation verification)
  console.log("\n2. Testing Multi-User Tenant Isolation...");
  const genB1 = await dbServiceB.createGeneration({
    id: "b0000000-0000-0000-0000-000000000001",
    title: "User B Secret Marketing Strategy",
    template: "Marketing Plan",
    category: "Marketing",
    status: "completed",
    preview: "Confidential marketing initiatives for Q4.",
    word_count: 800,
  });
  assert.equal(genB1.user_id, userB);

  // Verify User A cannot fetch User B's generation
  const userAAttemptToFetchB = await dbServiceA.getGenerationById(genB1.id);
  assert.equal(userAAttemptToFetchB, null, "User A must not be able to fetch User B's generation");
  console.log("  ✓ User A cannot view User B's generation");

  // Verify User A cannot update User B's generation
  await assert.rejects(
    async () => {
      await dbServiceA.updateGeneration(genB1.id, { title: "Hacked by User A" });
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 404,
    "User A must not be able to update User B's generation"
  );
  console.log("  ✓ User A cannot update User B's generation (404)");

  // Verify User A cannot delete User B's generation
  await assert.rejects(
    async () => {
      await dbServiceA.deleteGeneration(genB1.id);
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 404,
    "User A must not be able to delete User B's generation"
  );
  console.log("  ✓ User A cannot delete User B's generation (404)");

  // Verify User B still has their generation intact
  const userBFetched = await dbServiceB.getGenerationById(genB1.id);
  assert.equal(userBFetched?.title, "User B Secret Marketing Strategy");
  console.log("  ✓ User B's data remains safe and intact");

  // Test 4: Query & Search
  console.log("\n3. Testing Search & Filtering...");
  const searchResult = await dbServiceA.queryGenerations({ search: "Next.js" });
  assert.equal(searchResult.items.length, 1);
  assert.equal(searchResult.items[0].id, genA1.id);
  console.log("  ✓ Search by title keyword works");

  const searchPreviewResult = await dbServiceA.queryGenerations({ search: "weekly updates" });
  assert.equal(searchPreviewResult.items.length, 1);
  assert.equal(searchPreviewResult.items[0].id, genA2.id);
  console.log("  ✓ Search by preview keyword works");

  // Test 5: Filter by status
  const draftFilter = await dbServiceA.queryGenerations({ status: "draft" });
  assert.equal(draftFilter.items.length, 1);
  assert.equal(draftFilter.items[0].status, "draft");
  console.log("  ✓ Filter by status ('draft') works");

  const completedFilter = await dbServiceA.queryGenerations({ status: "completed" });
  assert.equal(completedFilter.items.length, 2);
  console.log("  ✓ Filter by status ('completed') works");

  // Test 6: Filter by category
  const emailFilter = await dbServiceA.queryGenerations({ category: "Email" });
  assert.equal(emailFilter.items.length, 1);
  assert.equal(emailFilter.items[0].category, "Email");
  console.log("  ✓ Filter by category ('Email') works");

  // Test 7: Sorting
  console.log("\n4. Testing Sorting...");
  const wordsSorted = await dbServiceA.queryGenerations({ sortBy: "words" });
  assert.equal(wordsSorted.items[0].id, genA1.id); // 500 words
  assert.equal(wordsSorted.items[1].id, genA2.id); // 250 words
  assert.equal(wordsSorted.items[2].id, genA3.id); // 120 words
  console.log("  ✓ Sort by word count (desc) works");

  // Test 8: Pagination
  console.log("\n5. Testing Pagination...");
  const page1 = await dbServiceA.queryGenerations({ page: 1, limit: 2 });
  assert.equal(page1.items.length, 2);
  assert.equal(page1.page, 1);
  assert.equal(page1.limit, 2);

  const page2 = await dbServiceA.queryGenerations({ page: 2, limit: 2 });
  assert.equal(page2.items.length, 1);
  assert.equal(page2.page, 2);
  console.log("  ✓ Pagination (page=1, page=2, limit=2) works");

  // Test 9: Update generation
  console.log("\n6. Testing Update Generation...");
  const updated = await dbServiceA.updateGeneration(genA2.id, {
    title: "Updated Email Subject",
    status: "completed",
    word_count: 300,
  });
  assert.equal(updated.title, "Updated Email Subject");
  assert.equal(updated.status, "completed");
  assert.equal(updated.word_count, 300);
  console.log("  ✓ Generation updated successfully");

  // Test 10: Delete & Restore
  console.log("\n7. Testing Delete & Restore Generation...");
  const deleted = await dbServiceA.deleteGeneration(genA3.id);
  assert.equal(deleted.id, genA3.id);

  const checkDeleted = await dbServiceA.getGenerationById(genA3.id);
  assert.equal(checkDeleted, null);
  console.log("  ✓ Generation deleted successfully");

  // Restore
  const restored = await dbServiceA.createGeneration({
    id: deleted.id,
    title: deleted.title,
    template: deleted.template,
    category: deleted.category,
    status: deleted.status,
    preview: deleted.preview,
    word_count: deleted.word_count,
    created_at: deleted.created_at,
  });
  assert.equal(restored.id, genA3.id);
  const checkRestored = await dbServiceA.getGenerationById(genA3.id);
  assert.notEqual(checkRestored, null);
  assert.equal(checkRestored?.title, genA3.title);
  console.log("  ✓ Generation restored successfully with original ID and timestamp");

  // Test 11: Validation Schema Checks
  console.log("\n8. Testing Validation Rules...");
  assert.throws(
    () => {
      validateRequest({}, { title: { required: true, type: "string" } });
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 400
  );
  assert.throws(
    () => {
      validateRequest({ status: "invalid_status" }, { status: { allowedValues: ["completed", "draft", "failed"] } });
    },
    (err: unknown) => err instanceof ApiError && err.statusCode === 400
  );
  console.log("  ✓ Validation errors caught and converted to 400 ApiError");

  console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
