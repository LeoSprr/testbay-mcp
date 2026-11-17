import type { Config } from "./config.js";
import { TestbayError } from "./errors.js";
import { createDraftInput, feedbackInput, listTestsInput, type CreateDraftInput, type FeedbackInput, type ListTestsInput } from "./schemas.js";

type Query = Record<string, string | number | boolean | undefined>;

export class TestbayApi {
  constructor(
    private readonly config: Config,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private requireKey() {
    if (!this.config.apiKey) {
      throw new TestbayError("AUTH_REQUIRED", "Set TESTBAY_API_KEY to a Testbay developer access token.", 401);
    }
    return this.config.apiKey;
  }

  private async request(method: "GET" | "POST", pathname: string, options: { query?: Query; body?: unknown } = {}) {
    const base = this.config.apiBaseUrl.replace(/\/$/, "");
    const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const headers = new Headers({ Accept: "application/json" });
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    const key = this.requireKey();
    headers.set("Authorization", `Bearer ${key}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await this.fetcher(url, {
        method,
        headers,
        signal: controller.signal,
        redirect: "error",
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
      const text = await response.text();
      let data: unknown = null;
      if (text) {
        try { data = JSON.parse(text); } catch { /* fall through */ }
      }
      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : undefined;
        if (response.status === 401) throw new TestbayError("UNAUTHORIZED", message ?? "Authentication failed. Check TESTBAY_API_KEY.", 401);
        if (response.status === 403) throw new TestbayError("FORBIDDEN", message ?? "Permission denied.", 403);
        if (response.status === 404) throw new TestbayError("NOT_FOUND", message ?? "Resource not found.", 404);
        if (response.status === 429) throw new TestbayError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
        if (response.status === 400) throw new TestbayError("VALIDATION", message ?? "Invalid request.", 400);
        throw new TestbayError("UPSTREAM", message ?? "Testbay could not complete the request.", response.status);
      }
      if (data === null && text) throw new TestbayError("BACKEND_RESPONSE", "Testbay returned an invalid JSON response.");
      return data;
    } catch (error) {
      if (error instanceof TestbayError) throw error;
      throw new TestbayError(controller.signal.aborted ? "TIMEOUT" : "UPSTREAM", controller.signal.aborted
        ? "The Testbay request timed out."
        : "Could not reach Testbay. Check TESTBAY_API_URL and network connectivity.");
    } finally {
      clearTimeout(timeout);
    }
  }

  listTests(raw: ListTestsInput) {
    const input = listTestsInput.parse(raw);
    return this.request("GET", "/public/mcp/tests", { query: { limit: input.limit } });
  }

  createTestDraft(raw: CreateDraftInput) {
    const input = createDraftInput.parse(raw);
    return this.request("POST", "/public/mcp/tests", { body: input });
  }

  getTestFeedback(raw: FeedbackInput) {
    const input = feedbackInput.parse(raw);
    const { test_id, ...query } = input;
    return this.request("GET", `/public/mcp/tests/${test_id}/feedback`, { query });
  }

  getAccountSummary() {
    return this.request("GET", "/public/mcp/account");
  }
}