import test from "node:test";
import assert from "node:assert/strict";
import {
  buildContactEmailContent,
  escapeHtml,
  getEmailConfig,
  mapResendError,
  maskEmail,
  parseSenderAddress,
  sendContactEmail,
} from "../src/lib/email.ts";

function withEmailEnv(values, callback) {
  const keys = ["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (key in values) process.env[key] = values[key];
    else delete process.env[key];
  }
  try { return callback(); }
  finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test("application email helpers validate sender configuration and format", async (t) => {
  await t.test("parses plain and display-name senders for the configured domain", () => {
    assert.deepEqual(parseSenderAddress("portfolio@proit.dev"), { email: "portfolio@proit.dev" });
    assert.deepEqual(parseSenderAddress('"Katiso Ntseare" <portfolio@proit.dev>'), {
      name: "Katiso Ntseare",
      email: "portfolio@proit.dev",
    });
    assert.equal(parseSenderAddress("not-an-email"), null);
    assert.equal(parseSenderAddress(""), null);
    assert.equal(parseSenderAddress(null), null);
  });

  await t.test("validates required configuration and returns the selected sender", () => {
    const values = {
      RESEND_API_KEY: "re_test_key_only",
      CONTACT_TO_EMAIL: "katisontseare@proit.dev",
      CONTACT_FROM_EMAIL: "Katiso Ntseare <portfolio@proit.dev>",
    };
    withEmailEnv(values, () => {
      const result = getEmailConfig();
      assert.equal(result.error, undefined);
      assert.equal(result.config.fromParsed.email, "portfolio@proit.dev");
      assert.equal(result.config.toEmail, "katisontseare@proit.dev");
    });
    withEmailEnv({ ...values, CONTACT_FROM_EMAIL: "invalid" }, () => {
      assert.match(getEmailConfig().error, /CONTACT_FROM_EMAIL/);
    });
    withEmailEnv({ ...values, RESEND_API_KEY: "bad-prefix" }, () => {
      assert.match(getEmailConfig().error, /format is invalid/);
    });
  });

  await t.test("masks addresses and escapes HTML using application helpers", () => {
    assert.equal(maskEmail("katisontseare@proit.dev"), "k***e@proit.dev");
    assert.equal(maskEmail(""), "***");
    assert.equal(escapeHtml('<b>& "safe"</b>'), "&lt;b&gt;&amp; &quot;safe&quot;&lt;/b&gt;");
    const body = buildContactEmailContent({
      name: "Visitor <script>",
      email: "visitor@example.com",
      enquiryType: "General enquiry",
      subject: "Hello",
      message: "Please review <img src=x>",
    });
    assert.ok(body.text.includes("visitor@example.com"));
    assert.ok(body.html.includes("&lt;script&gt;"));
    assert.equal(body.html.includes("<img src=x>"), false);
  });
});

test("sendContactEmail uses configured sender and visitor reply-to with a Resend mock", async () => {
  const values = {
    RESEND_API_KEY: "re_test_key_only",
    CONTACT_TO_EMAIL: "katisontseare@proit.dev",
    CONTACT_FROM_EMAIL: "Katiso Ntseare <portfolio@proit.dev>",
  };
  const submitted = [];
  const mock = { emails: { async send(payload) { submitted.push(payload); return { data: { id: "mock-email-id" }, error: null }; } } };
  const result = await withEmailEnv(values, () => sendContactEmail({
    name: "Test Visitor",
    email: "visitor@example.com",
    enquiryType: "Software development",
    subject: "Test",
    message: "This is a sufficiently long test enquiry for email delivery.",
  }, mock));
  assert.equal(result.success, true);
  assert.equal(result.emailId, "mock-email-id");
  assert.equal(submitted[0].from, values.CONTACT_FROM_EMAIL);
  assert.deepEqual(submitted[0].to, [values.CONTACT_TO_EMAIL]);
  assert.equal(submitted[0].replyTo, "visitor@example.com");
  assert.notEqual(submitted[0].from, submitted[0].replyTo);
});

test("application Resend error mapping returns safe status and diagnostics", async (t) => {
  const cases = [
    [{ statusCode: 403, name: "validation_error", message: "The proit.dev domain is not verified." }, 503, "DOMAIN_UNVERIFIED"],
    [{ statusCode: 403, name: "validation_error", message: "You can only send testing emails to your own email address." }, 503, "TESTING_RESTRICTION"],
    [{ statusCode: 401, name: "restricted_api_key", message: "API key is unauthorized" }, 503, "AUTH_FAILED"],
    [{ statusCode: 429, name: "rate_limit_exceeded", message: "Too many requests" }, 429, "RATE_LIMITED"],
    [{ statusCode: 422, name: "validation_error", message: "Invalid recipient" }, 400, "INVALID_REQUEST"],
    [{ statusCode: 500, name: "internal_server_error", message: "Provider error" }, 502, "PROVIDER_UNAVAILABLE"],
  ];
  for (const [error, statusCode, category] of cases) {
    await t.test(`maps ${category}`, () => {
      const mapped = mapResendError(error, "ref_test", { fromEmail: "portfolio@proit.dev", toEmail: "katisontseare@proit.dev" });
      assert.equal(mapped.statusCode, statusCode);
      assert.equal(mapped.category, category);
      assert.ok(mapped.userMessage);
      if (category === "TESTING_RESTRICTION") {
        assert.match(mapped.developerDiagnostic, /Verify the domain used by CONTACT_FROM_EMAIL/);
        assert.doesNotMatch(mapped.developerDiagnostic, /notify\.proit\.dev|onboarding@resend\.dev/);
      }
    });
  }
});
