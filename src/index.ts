#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { TestbayError } from "./errors.js";
import { createTestbayServer } from "./server.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    process.stderr.write("Usage: testbay-mcp\nstdio MCP server. Set TESTBAY_API_KEY and optional TESTBAY_API_URL.\n");
    return;
  }
  if (args.length > 0) throw new TestbayError("CONFIGURATION", "Usage: testbay-mcp [--help]");
  const config = loadConfig();
  const server = createTestbayServer(config);
  await server.connect(new StdioServerTransport());
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    void server.close().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.stdin.once("end", shutdown);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof TestbayError ? error.message : "Could not start Testbay MCP."}\n`);
  process.exitCode = 1;
});