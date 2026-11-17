import { z } from "zod";

const httpUrl = z.string().max(2048).url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Use a public https:// URL.");

export const listTestsInput = z.object({
  limit: z.number().int().min(1).max(100).default(25)
    .describe("Maximum tests returned in each group (draft, active, completed)."),
}).strict();

export const createDraftInput = z.object({
  title: z.string().trim().min(1).max(120).describe("Short test title."),
  description: z.string().trim().min(1).max(2000).describe("What the product is and who it is for."),
  what_to_test: z.string().trim().min(1).max(4000).describe("Flows or features testers should focus on."),
  instructions: z.string().trim().min(1).max(4000).describe("Step-by-step instructions for testers."),
  platform: z.enum(["web", "ios"]).describe("web for websites, ios for TestFlight apps."),
  link: httpUrl.describe("Website URL or https://testflight.apple.com/join/... for iOS."),
  reward_cents: z.number().int().min(1).max(1_000_000).describe("Cash reward per tester in USD cents."),
  max_testers: z.number().int().min(1).max(1000).describe("Number of tester slots."),
  est_minutes: z.number().int().min(1).max(240).default(15).describe("Estimated minutes per test."),
}).strict();

export const feedbackInput = z.object({
  test_id: z.string().uuid().describe("Test id from list_tests."),
  limit: z.number().int().min(1).max(100).default(25).describe("Tester sessions per page."),
  offset: z.number().int().min(0).max(100_000).default(0).describe("Sessions to skip for pagination."),
  only_approved: z.boolean().default(false).describe("Only include feedback that passed review."),
}).strict();

export type ListTestsInput = z.infer<typeof listTestsInput>;
export type CreateDraftInput = z.infer<typeof createDraftInput>;
export type FeedbackInput = z.infer<typeof feedbackInput>;