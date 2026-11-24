import test from "node:test";
import assert from "node:assert/strict";

// Helper functions matching src/lib/email.ts
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseSenderAddress(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const angleMatch = trimmed.match(/^(?:["']?([^"']+)["']?\s+)?<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1]?.trim();
    const email = angleMatch[2].trim();
    if (isValidEmail(email)) {
      return { name: name || undefined, email };
    }
    return null;
  }
  if (isValidEmail(trimmed)) {
    return { email: trimmed };
  }
  return null;
}

function maskEmail(email) {
  if (!email) return "***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mapResendError(error, referenceId, context) {
  const status = error?.statusCode ?? 500;
  const msg = (error?.message || "").toLowerCase();
  const errorName = error?.name || "";

  if (
    msg.includes("not verified") ||
    msg.includes("domain is not verified") ||
    (status === 403 && msg.includes("domain"))
  ) {
    return {
      statusCode: 503,
      userMessage: "The email delivery system is currently completing domain verification. Please try again soon or connect with me via LinkedIn.",
      category: "DOMAIN_UNVERIFIED",
      developerDiagnostic: `The custom sender domain in CONTACT_FROM_EMAIL (${context?.fromEmail || "unknown"}) is not yet verified in Resend. Please add and verify DNS records in your Resend dashboard at https://resend.com/domains.`,
    };
  }

  if (
    msg.includes("testing emails") ||
    msg.includes("can only send testing emails to your own email address") ||
    (status === 403 && msg.includes("testing"))
  ) {
    return {
      statusCode: 503,
      userMessage: "The email delivery system is currently restricted to testing mode. Please try again later or reach out directly on LinkedIn.",
      category: "TESTING_RESTRICTION",
      developerDiagnostic: `Resend is in testing mode (using onboarding@resend.dev or unverified domain), which restricts delivery only to the email registered on the Resend account. To deliver to '${context?.toEmail}', verify the custom domain 'notify.proit.dev'.`,
    };
  }

  if (
    status === 401 ||
    errorName === "restricted_api_key" ||
    msg.includes("api key") ||
    msg.includes("unauthorized")
  ) {
    return {
      statusCode: 503,
      userMessage: "The email delivery service is temporarily unavailable. Please try again later.",
      category: "AUTH_FAILED",
      developerDiagnostic: `Resend API authentication failed (${error?.message}). Verify that RESEND_API_KEY is valid and has email sending permissions.`,
    };
  }

  if (status === 429 || msg.includes("rate limit") || msg.includes("quota")) {
    return {
      statusCode: 429,
      userMessage: "Too many messages have been submitted recently. Please wait a short while before trying again.",
      category: "RATE_LIMITED",
      developerDiagnostic: `Resend rate limit or quota exceeded (${error?.message}). Check your account quota at https://resend.com.`,
    };
  }

  if (status === 400 || status === 422 || errorName === "validation_error") {
    return {
      statusCode: 400,
      userMessage: "The message could not be sent due to invalid formatting. Please check your details and try again.",
      category: "INVALID_REQUEST",
      developerDiagnostic: `Resend rejected request parameters (${error?.message}). Check sender and recipient formats.`,
    };
  }

  if (status >= 500 && status < 600) {
    return {
      statusCode: 502,
      userMessage: "The email provider is temporarily experiencing technical difficulties. Please try again in a few minutes.",
      category: "PROVIDER_UNAVAILABLE",
      developerDiagnostic: `Resend upstream server error ${status}: ${error?.message}`,
    };
  }

  return {
    statusCode: 500,
    userMessage: "An unexpected error occurred while processing your message. Please try again later.",
    category: "UNKNOWN_ERROR",
    developerDiagnostic: `Unhandled Resend response (${status} - ${errorName}: ${error?.message})`,
  };
}

function buildContactEmailContent(data) {
  const timestamp = data.submittedAt || new Date().toISOString();
  const text = [
    `NEW CONTACT ENQUIRY`,
    `From:         ${data.name} <${data.email}>`,
    `Organisation: ${data.organisation || "Not provided"}`,
    `Enquiry Type: ${data.enquiryType}`,
    `Subject:      ${data.subject}`,
    `Date & Time:  ${timestamp}`,
    `Message:`,
    data.message,
  ].join("\n");

  const html = `<p>From: ${escapeHtml(data.name)} &lt;${escapeHtml(data.email)}&gt;</p><p>${escapeHtml(data.message)}</p>`;
  return { text, html };
}

test("Email Service Configuration & Parsing", async (t) => {
  await t.test("Validates simple email address for sender", () => {
    const parsed = parseSenderAddress("portfolio@notify.proit.dev");
    assert.ok(parsed);
    assert.equal(parsed.email, "portfolio@notify.proit.dev");
    assert.equal(parsed.name, undefined);
  });

  await t.test("Validates display name format for sender", () => {
    const parsed = parseSenderAddress("Katiso Ntseare <portfolio@notify.proit.dev>");
    assert.ok(parsed);
    assert.equal(parsed.email, "portfolio@notify.proit.dev");
    assert.equal(parsed.name, "Katiso Ntseare");
  });

  await t.test("Validates quoted display name format for sender", () => {
    const parsed = parseSenderAddress('"Katiso Ntseare" <portfolio@notify.proit.dev>');
    assert.ok(parsed);
    assert.equal(parsed.email, "portfolio@notify.proit.dev");
    assert.equal(parsed.name, "Katiso Ntseare");
  });

  await t.test("Rejects invalid sender address format", () => {
    assert.equal(parseSenderAddress("not-an-email"), null);
    assert.equal(parseSenderAddress("<>"), null);
    assert.equal(parseSenderAddress(""), null);
    assert.equal(parseSenderAddress(null), null);
  });

  await t.test("Correctly masks email addresses for safe logging", () => {
    assert.equal(maskEmail("katisontseare@proit.dev"), "k***e@proit.dev");
    assert.equal(maskEmail("me@test.com"), "m***@test.com");
    assert.equal(maskEmail(""), "***");
  });
});

test("Email Content Generation & HTML Escaping", async (t) => {
  await t.test("Escapes dangerous HTML tags and script injections", () => {
    const raw = '<script>alert("XSS")</script> & \'hello\'';
    const escaped = escapeHtml(raw);
    assert.equal(escaped, "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &#39;hello&#39;");
    assert.equal(escaped.includes("<script>"), false);
  });

  await t.test("Builds both plain text and escaped HTML email bodies", () => {
    const content = buildContactEmailContent({
      name: "John Doe <Tester>",
      email: "john@example.com",
      organisation: "Acme Corp",
      enquiryType: "Software development",
      subject: "Project Enquiry",
      message: "We need an API with <b>security</b>.",
    });

    assert.ok(content.text.includes("John Doe <Tester>"));
    assert.ok(content.text.includes("john@example.com"));
    assert.ok(content.html.includes("&lt;Tester&gt;"));
    assert.ok(content.html.includes("&lt;b&gt;security&lt;/b&gt;"));
    assert.equal(content.html.includes("<b>security</b>"), false);
  });
});

test("Resend Error Mapping & Status Codes", async (t) => {
  await t.test("Maps unverified domain error to HTTP 503 and DOMAIN_UNVERIFIED", () => {
    const resendError = {
      statusCode: 403,
      name: "validation_error",
      message: "The notify.proit.dev domain is not verified. Please, add and verify your domain on https://resend.com/domains",
    };
    const mapped = mapResendError(resendError, "ref_123", { fromEmail: "portfolio@notify.proit.dev" });
    assert.equal(mapped.statusCode, 503);
    assert.equal(mapped.category, "DOMAIN_UNVERIFIED");
    assert.ok(mapped.developerDiagnostic.includes("notify.proit.dev"));
    // User message does NOT expose raw API URLs or technical secrets
    assert.equal(mapped.userMessage.includes("https://resend.com"), false);
  });

  await t.test("Maps testing restriction error to HTTP 503 and TESTING_RESTRICTION", () => {
    const resendError = {
      statusCode: 403,
      name: "validation_error",
      message: "You can only send testing emails to your own email address (admin@example.com).",
    };
    const mapped = mapResendError(resendError, "ref_123", { toEmail: "katisontseare@proit.dev" });
    assert.equal(mapped.statusCode, 503);
    assert.equal(mapped.category, "TESTING_RESTRICTION");
    assert.ok(mapped.developerDiagnostic.includes("testing mode"));
  });

  await t.test("Maps authentication failure to HTTP 503 and AUTH_FAILED", () => {
    const resendError = {
      statusCode: 401,
      name: "restricted_api_key",
      message: "This API key is restricted to only send emails",
    };
    const mapped = mapResendError(resendError, "ref_123");
    assert.equal(mapped.statusCode, 503);
    assert.equal(mapped.category, "AUTH_FAILED");
  });

  await t.test("Maps rate limiting to HTTP 429 and RATE_LIMITED", () => {
    const resendError = {
      statusCode: 429,
      name: "rate_limit_exceeded",
      message: "Too many requests",
    };
    const mapped = mapResendError(resendError, "ref_123");
    assert.equal(mapped.statusCode, 429);
    assert.equal(mapped.category, "RATE_LIMITED");
  });

  await t.test("Maps upstream 5xx errors to HTTP 502 Bad Gateway", () => {
    const resendError = {
      statusCode: 500,
      name: "internal_server_error",
      message: "Resend internal server error",
    };
    const mapped = mapResendError(resendError, "ref_123");
    assert.equal(mapped.statusCode, 502);
    assert.equal(mapped.category, "PROVIDER_UNAVAILABLE");
  });

  await t.test("Maps invalid payload to HTTP 400 Bad Request", () => {
    const resendError = {
      statusCode: 422,
      name: "validation_error",
      message: "Invalid recipient email address",
    };
    const mapped = mapResendError(resendError, "ref_123");
    assert.equal(mapped.statusCode, 400);
    assert.equal(mapped.category, "INVALID_REQUEST");
  });
});
