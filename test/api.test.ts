import assert from "node:assert/strict";
import { test } from "node:test";
import { TestbayApi } from "../src/api.js";
import { loadConfig } from "../src/config.js";
import { TestbayError } from "../src/errors.js";
import { createDraftInput, feedbackInput } from "../src/schemas.js";
import { config, create, json, mockFetch, testId } from "./helpers.js";

const errorCode = (code: string) => (error: unknown) => error instanceof TestbayError && error.code === code;

test("configuration accepts defaults and rejects invalid API URLs", () => {
  assert.equal(loadConfig({ TESTBAY_API_KEY: "token" }).apiBaseUrl, "https://testbay.dev/api");
  assert.throws(() => loadConfig({ TESTBAY_API_URL: "http://evil.test", TESTBAY_API_KEY: "token" }), /Configure valid/);
});

test("protected calls require TESTBAY_API_KEY before network access", async () => {
  const api = new TestbayApi(loadConfig({}));
  const mock = mockFetch(() => { throw new Error("network"); });
  (api as unknown as { fetcher: typeof fetch }).fetcher = mock.fetcher;
  await assert.rejects(api.listTests({ limit: 5 }), errorCode("AUTH_REQUIRED"));
  assert.equal(mock.calls.length, 0);
});

test("list_tests calls the REST API with bearer auth", async () => {
  const mock = mockFetch((req) => {
    assert.equal(req.url.pathname, "/api/public/mcp/tests");
    assert.equal(req.headers.get("Authorization"), "Bearer test-developer-token");
    assert.equal(req.url.searchParams.get("limit"), "10");
    return json({ draft: [], active: [{ id: testId }], completed: [], counts: { draft: 0, active: 1, completed: 0 } });
  });
  const api = new TestbayApi(config, mock.fetcher);
  const result = await api.listTests({ limit: 10 });
  assert.deepEqual((result as { counts: { active: number } }).counts.active, 1);
});

test("create_test_draft posts validated body", async () => {
  const mock = mockFetch((req) => {
    assert.equal(req.method, "POST");
    assert.deepEqual(req.body, createDraftInput.parse(create));
    return json({ test: { id: testId, status: "draft" } });
  });
  const api = new TestbayApi(config, mock.fetcher);
  const result = await api.createTestDraft(create);
  assert.equal((result as { test: { status: string } }).test.status, "draft");
});

test("get_test_feedback maps query params and surfaces API errors", async () => {
  const mock = mockFetch((req) => {
    assert.match(req.url.pathname, new RegExp(`/public/mcp/tests/${testId}/feedback$`));
    assert.equal(req.url.searchParams.get("only_approved"), "true");
    return json({ feedback: [], count: 0 });
  });
  const api = new TestbayApi(config, mock.fetcher);
  await api.getTestFeedback(feedbackInput.parse({ test_id: testId, only_approved: true }));
  mock.fetcher = (async () => new Response(JSON.stringify({ error: "Test not found." }), { status: 404 })) as typeof fetch;
  (api as unknown as { fetcher: typeof fetch }).fetcher = mock.fetcher;
  await assert.rejects(
    api.getTestFeedback(feedbackInput.parse({ test_id: testId })),
    errorCode("NOT_FOUND"),
  );
});