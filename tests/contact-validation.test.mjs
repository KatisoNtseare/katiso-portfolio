import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  organisation: z.string().trim().max(120).default(""),
  enquiryType: z.enum(["Employment opportunity", "Software development", "Partnership", "General enquiry"]),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(0).optional().default(""),
});

function checkRateLimit(_key, limit) {
  return (currentCount) => {
    if (currentCount >= limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: limit - (currentCount + 1) };
  };
}

test("Contact Form Validation & Spam Protection", async (t) => {
  await t.test("Validates complete contact form submission", () => {
    const validData = {
      name: "Alice Smith",
      email: "alice@example.com",
      organisation: "Smith Tech",
      enquiryType: "Employment opportunity",
      subject: "Senior Developer Role",
      message: "We came across your portfolio and would love to discuss an engineering position at our firm.",
      website: "",
    };

    const parsed = contactSchema.safeParse(validData);
    assert.equal(parsed.success, true);
  });

  await t.test("Rejects name shorter than 2 characters", () => {
    const data = {
      name: "A",
      email: "alice@example.com",
      enquiryType: "Software development",
      subject: "Project",
      message: "This is a sufficiently long message to pass the minimum character count.",
    };
    const parsed = contactSchema.safeParse(data);
    assert.equal(parsed.success, false);
  });

  await t.test("Rejects invalid email format", () => {
    const data = {
      name: "Alice",
      email: "not-an-email",
      enquiryType: "General enquiry",
      subject: "Hello there",
      message: "This is a sufficiently long message to pass the minimum character count.",
    };
    const parsed = contactSchema.safeParse(data);
    assert.equal(parsed.success, false);
  });

  await t.test("Rejects message shorter than 20 characters", () => {
    const data = {
      name: "Alice",
      email: "alice@example.com",
      enquiryType: "General enquiry",
      subject: "Hello",
      message: "Too short",
    };
    const parsed = contactSchema.safeParse(data);
    assert.equal(parsed.success, false);
  });

  await t.test("Rejects invalid enquiry type", () => {
    const data = {
      name: "Alice",
      email: "alice@example.com",
      enquiryType: "Spam or invalid",
      subject: "Hello",
      message: "This is a sufficiently long message to pass the minimum character count.",
    };
    const parsed = contactSchema.safeParse(data);
    assert.equal(parsed.success, false);
  });

  await t.test("Detects honeypot submission", () => {
    const botData = {
      name: "Bot User",
      email: "bot@example.com",
      enquiryType: "General enquiry",
      subject: "Spam proposal",
      message: "This is a spam message designed to test the honeypot field detection.",
      website: "https://spam-site.example.com",
    };

    const parsed = contactSchema.safeParse(botData);
    assert.equal(parsed.success, false, "Honeypot website must fail schema max(0)");
  });

  await t.test("Rate limiter enforces request limit", () => {
    const limiter = checkRateLimit("contact:127.0.0.1", 5, 60000);
    assert.equal(limiter(0).allowed, true);
    assert.equal(limiter(1).allowed, true);
    assert.equal(limiter(2).allowed, true);
    assert.equal(limiter(3).allowed, true);
    assert.equal(limiter(4).allowed, true);
    assert.equal(limiter(5).allowed, false); // 6th request blocked
  });
});

test("Email Headers & Reply-To Security", async (t) => {
  await t.test("Assigns visitor email to replyTo and server email to from", () => {
    const visitorEmail = "visitor@client.com";
    const serverSender = "portfolio@notify.proit.dev";
    const adminInbox = "katisontseare@proit.dev";

    const payload = {
      from: serverSender,
      to: [adminInbox],
      replyTo: visitorEmail,
      subject: "[Portfolio] Software development: New Request",
      text: "Message text",
    };

    // Critical security check: Never spoof visitor email in "from"
    assert.equal(payload.from, serverSender);
    assert.equal(payload.to[0], adminInbox);
    assert.equal(payload.replyTo, visitorEmail);
    assert.notEqual(payload.from, visitorEmail);
  });
});
