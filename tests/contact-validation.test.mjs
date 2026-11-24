import test from "node:test";
import assert from "node:assert/strict";
import { contactSchema } from "../src/lib/validation.ts";
import { checkRateLimit } from "../src/lib/rate-limit.ts";

const validContact = {
  name: "Alice Smith",
  email: "alice@example.com",
  organisation: "Smith Tech",
  enquiryType: "Employment opportunity",
  subject: "Senior Developer Role",
  message: "We came across your portfolio and would like to discuss an engineering position.",
  website: "",
};

test("application contact schema validates real submissions and rejects invalid payloads", async (t) => {
  await t.test("accepts a complete contact enquiry", () => {
    const parsed = contactSchema.safeParse(validContact);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data.organisation, "Smith Tech");
  });
  await t.test("rejects invalid email, short content, unknown enquiry type and honeypot input", () => {
    for (const patch of [
      { email: "not-an-email" },
      { name: "A" },
      { subject: "Hi" },
      { message: "Too short" },
      { enquiryType: "Spam" },
      { website: "https://bot.example" },
    ]) assert.equal(contactSchema.safeParse({ ...validContact, ...patch }).success, false);
  });
});

test("application rate limiter enforces the contact request quota", () => {
  const key = `unit-contact:${Date.now()}:${Math.random()}`;
  const results = Array.from({ length: 6 }, () => checkRateLimit(key, 5, 60_000));
  assert.equal(results.filter((item) => item.allowed).length, 5);
  assert.equal(results[5].allowed, false);
  assert.equal(results[5].remaining, 0);
});
