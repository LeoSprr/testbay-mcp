import { loadConfig } from "../src/config.js";

export const config = loadConfig({
  TESTBAY_API_URL: "https://testbay.dev/api",
  TESTBAY_API_KEY: "test-developer-token",
});

export const testId = "00000000-0000-4000-8000-000000000001";

export const create = {
  title: "Checkout flow",
  description: "SaaS onboarding",
  what_to_test: "Signup and billing",
  instructions: "Create an account and open billing.",
  platform: "web" as const,
  link: "https://example.com",
  reward_cents: 500,
  max_testers: 3,
  est_minutes: 15,
};

export type MockRequest = {
  url: URL;
  method: string;
  headers: Headers;
  body?: unknown;
};

export function json(value: unknown) {
  return new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
}

export function mockFetch(handler: (req: MockRequest) => Response | Promise<Response>) {
  const calls: MockRequest[] = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers);
    let body: unknown;
    if (init?.body && typeof init.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    const req: MockRequest = { url, method: init?.method ?? "GET", headers, body };
    calls.push(req);
    return handler(req);
  }) as typeof fetch;
  return { fetcher, calls };
}