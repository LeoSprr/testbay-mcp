import { webcrypto } from "node:crypto";

// MCP SDK v1's HTTP transport uses global Web Crypto. Node 18 exposes it via
// node:crypto but does not enable the global in every execution mode.
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}
