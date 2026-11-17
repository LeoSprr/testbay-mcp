import { z } from "zod";
import { TestbayError } from "./errors.js";

const apiBase = z.string().url().refine((value) => {
  const url = new URL(value);
  return !url.username && !url.password && !url.search && !url.hash
    && (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)));
}, "Use HTTPS (HTTP allowed on loopback only).");

export interface Config {
  apiBaseUrl: string;
  apiKey?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = z.object({
    TESTBAY_API_URL: apiBase.default("https://testbay.dev/api"),
    TESTBAY_API_KEY: z.string().trim().min(1).regex(/^\S+$/).optional(),
  }).safeParse({
    TESTBAY_API_URL: env.TESTBAY_API_URL,
    TESTBAY_API_KEY: env.TESTBAY_API_KEY?.trim() || undefined,
  });
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))].join(", ");
    throw new TestbayError("CONFIGURATION", `Configure valid ${names}. See testbay-mcp/.env.example.`);
  }
  const { TESTBAY_API_URL, TESTBAY_API_KEY } = parsed.data;
  return {
    apiBaseUrl: TESTBAY_API_URL.replace(/\/$/, ""),
    ...(TESTBAY_API_KEY ? { apiKey: TESTBAY_API_KEY } : {}),
  };
}