import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { TestbayApi } from "../src/api.js";
import { createTestbayServer } from "../src/server.js";
import { config, create, json, mockFetch, testId } from "./helpers.js";

const names = ["create_test_draft", "get_account_summary", "get_test_feedback", "list_tests"];
const text = (result: { content: Array<{ text: string }> }) => JSON.parse(result.content[0]!.text);

test("MCP discovery and tool calls work in-process", async () => {
  const mock = mockFetch((req) => {
    if (req.url.pathname.endsWith("/account")) return json({ account: { status: "active" }, credits: { balance_cents: 1000 } });
    if (req.method === "POST") return json({ test: { id: testId, status: "draft" } });
    if (req.url.pathname.endsWith("/tests")) return json({ draft: [], active: [], completed: [], counts: { draft: 0, active: 0, completed: 0 } });
    return json({ feedback: [], count: 0 });
  });
  const server = createTestbayServer(config, new TestbayApi(config, mock.fetcher));
  const client = new Client({ name: "integration", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), names);
    const listed = await client.callTool({ name: "list_tests", arguments: {} });
    assert.equal(text(listed).counts.draft, 0);
    const created = await client.callTool({ name: "create_test_draft", arguments: create });
    assert.equal(text(created).test.status, "draft");
    const denied = await client.callTool({ name: "get_test_feedback", arguments: { test_id: testId } });
    assert.equal(denied.isError, undefined);
  } finally {
    await client.close();
    await server.close();
  }
});

test("built stdio entry reports missing API key without polluting stdout", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../dist/index.js", import.meta.url))],
    env: { TESTBAY_API_URL: config.apiBaseUrl, TESTBAY_API_KEY: "" },
    stderr: "pipe",
  });
  const client = new Client({ name: "stdio", version: "1.0.0" });
  try {
    await client.connect(transport);
    assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), names);
    const denied = await client.callTool({ name: "list_tests", arguments: {} });
    assert.equal(denied.isError, true);
    assert.equal(text(denied as { content: Array<{ text: string }>; isError?: boolean }).error.code, "AUTH_REQUIRED");
  } finally {
    await client.close();
  }
});

test("invalid startup config exits non-zero without stdout noise", () => {
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL("../dist/index.js", import.meta.url)),
    "--unknown-flag",
  ], {
    env: { TESTBAY_API_KEY: "x" },
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Usage: testbay-mcp/);
});