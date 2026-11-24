import "server-only";
import { Resend } from "resend";

export type EmailFailureCategory =
  | "CONFIG_MISSING"
  | "DOMAIN_UNVERIFIED"
  | "TESTING_RESTRICTION"
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "PROVIDER_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export type EmailServiceResult =
  | { success: true; emailId: string }
  | {
      success: false;
      referenceId: string;
      statusCode: number;
      userMessage: string;
      category: EmailFailureCategory;
      developerDiagnostic?: string;
    };

export type EmailConfig = {
  apiKey: string;
  toEmail: string;
  fromEmail: string;
  fromParsed: { name?: string; email: string };
};

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function parseSenderAddress(raw: string): { name?: string; email: string } | null {
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

export function maskEmail(email?: string): string {
  if (!email) return "***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function generateReferenceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ref_${timestamp}_${random}`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getEmailConfig(): { config?: EmailConfig; error?: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.CONTACT_TO_EMAIL?.trim();
  const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim();

  if (!apiKey) {
    return { error: "RESEND_API_KEY is missing. Configure it in .env.local." };
  }
  if (!apiKey.startsWith("re_")) {
    return { error: "RESEND_API_KEY format is invalid (must start with 're_')." };
  }
  if (!toEmail) {
    return { error: "CONTACT_TO_EMAIL is missing. Configure your recipient email address in .env.local." };
  }
  if (!isValidEmail(toEmail)) {
    return { error: `CONTACT_TO_EMAIL (${toEmail}) is not a valid email address.` };
  }
  if (!fromEmail) {
    return { error: "CONTACT_FROM_EMAIL is missing. Configure your sender address in .env.local." };
  }
  const fromParsed = parseSenderAddress(fromEmail);
  if (!fromParsed) {
    return { error: `CONTACT_FROM_EMAIL (${fromEmail}) must be a valid email or 'Display Name <email@example.com>'.` };
  }

  return {
    config: {
      apiKey,
      toEmail,
      fromEmail,
      fromParsed,
    },
  };
}

export function logEmailFailure(info: {
  referenceId: string;
  provider: string;
  category: EmailFailureCategory;
  providerStatusCode?: number | null;
  providerErrorName?: string;
  providerErrorMessage?: string;
  recipientMasked?: string;
  senderMasked?: string;
  developerDiagnostic?: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: "EMAIL_DELIVERY_FAILURE",
    referenceId: info.referenceId,
    provider: info.provider,
    category: info.category,
    providerStatusCode: info.providerStatusCode ?? null,
    providerErrorName: info.providerErrorName ?? null,
    providerErrorMessage: info.providerErrorMessage ?? null,
    recipient: info.recipientMasked ?? null,
    sender: info.senderMasked ?? null,
    diagnostic: info.developerDiagnostic ?? null,
  };
  console.error("[CONTACT_EMAIL_FAILURE]", JSON.stringify(logEntry));
}

export function mapResendError(
  error: { statusCode?: number | null; message?: string; name?: string } | null,
  referenceId: string,
  context?: { fromEmail?: string; toEmail?: string }
): {
  statusCode: number;
  userMessage: string;
  category: EmailFailureCategory;
  developerDiagnostic: string;
} {
  const status = error?.statusCode ?? 500;
  const msg = (error?.message || "").toLowerCase();
  const errorName = error?.name || "";

  // 1. Unverified Domain
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

  // 2. Testing mode recipient restriction
  if (
    msg.includes("testing emails") ||
    msg.includes("can only send testing emails to your own email address") ||
    (status === 403 && msg.includes("testing"))
  ) {
    return {
      statusCode: 503,
      userMessage: "The email delivery system is currently restricted to testing mode. Please try again later or reach out directly on LinkedIn.",
      category: "TESTING_RESTRICTION",
      developerDiagnostic: `Resend restricted delivery to '${context?.toEmail || "the configured recipient"}'. Verify the domain used by CONTACT_FROM_EMAIL and review the sender's sending status in Resend.`,
    };
  }

  // 3. Authentication or Restricted API Key
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

  // 4. Rate Limiting or Quota
  if (status === 429 || msg.includes("rate limit") || msg.includes("quota")) {
    return {
      statusCode: 429,
      userMessage: "Too many messages have been submitted recently. Please wait a short while before trying again.",
      category: "RATE_LIMITED",
      developerDiagnostic: `Resend rate limit or quota exceeded (${error?.message}). Check your account quota at https://resend.com.`,
    };
  }

  // 5. Invalid Request or Validation Error
  if (status === 400 || status === 422 || errorName === "validation_error") {
    return {
      statusCode: 400,
      userMessage: "The message could not be sent due to invalid formatting. Please check your details and try again.",
      category: "INVALID_REQUEST",
      developerDiagnostic: `Resend rejected request parameters (${error?.message}). Check sender and recipient formats.`,
    };
  }

  // 6. Upstream Provider Outage / 5xx
  if (status >= 500 && status < 600) {
    return {
      statusCode: 502,
      userMessage: "The email provider is temporarily experiencing technical difficulties. Please try again in a few minutes.",
      category: "PROVIDER_UNAVAILABLE",
      developerDiagnostic: `Resend upstream server error ${status}: ${error?.message}`,
    };
  }

  // 7. Fallback Unknown Error
  return {
    statusCode: 500,
    userMessage: "An unexpected error occurred while processing your message. Please try again later.",
    category: "UNKNOWN_ERROR",
    developerDiagnostic: `Unhandled Resend response (${status} - ${errorName}: ${error?.message})`,
  };
}

export function buildContactEmailContent(data: {
  name: string;
  email: string;
  organisation?: string;
  enquiryType: string;
  subject: string;
  message: string;
  submittedAt?: string;
}) {
  const timestamp = data.submittedAt || new Date().toISOString();
  const text = [
    `NEW CONTACT ENQUIRY`,
    `----------------------------------------`,
    `From:         ${data.name} <${data.email}>`,
    `Organisation: ${data.organisation || "Not provided"}`,
    `Enquiry Type: ${data.enquiryType}`,
    `Subject:      ${data.subject}`,
    `Date & Time:  ${timestamp}`,
    `Source:       Katiso Ntseare Portfolio`,
    `----------------------------------------`,
    ``,
    `MESSAGE:`,
    data.message,
    ``,
    `----------------------------------------`,
    `Reply directly to this email to contact ${data.name}.`,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Contact Enquiry</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #171717; background-color: #f8f8f6; padding: 24px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e1; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
    <div style="border-bottom: 2px solid #df3035; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="font-size: 11px; font-weight: 700; color: #df3035; text-transform: uppercase; letter-spacing: 1.5px;">Portfolio Contact Form</span>
      <h2 style="margin: 6px 0 0; font-size: 20px; color: #171717;">${escapeHtml(data.subject)}</h2>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
      <tr>
        <td style="padding: 6px 0; color: #707070; width: 120px;"><strong>From:</strong></td>
        <td style="padding: 6px 0; color: #171717;">${escapeHtml(data.name)} &lt;<a href="mailto:${escapeHtml(data.email)}" style="color: #df3035; text-decoration: none;">${escapeHtml(data.email)}</a>&gt;</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #707070;"><strong>Organisation:</strong></td>
        <td style="padding: 6px 0; color: #171717;">${escapeHtml(data.organisation || "Not provided")}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #707070;"><strong>Enquiry Type:</strong></td>
        <td style="padding: 6px 0; color: #171717;">${escapeHtml(data.enquiryType)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #707070;"><strong>Submitted:</strong></td>
        <td style="padding: 6px 0; color: #171717;">${escapeHtml(timestamp)}</td>
      </tr>
    </table>
    <div style="background: #fafaf8; border: 1px solid #efefec; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
      <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #707070; margin-bottom: 8px; letter-spacing: 1px;">Message:</strong>
      <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #222;">${escapeHtml(data.message)}</p>
    </div>
    <div style="border-top: 1px solid #efefec; padding-top: 14px; font-size: 12px; color: #888;">
      You can reply directly to this notification to reach <strong>${escapeHtml(data.name)}</strong> at <code>${escapeHtml(data.email)}</code>.
    </div>
  </div>
</body>
</html>`.trim();

  return { text, html };
}

export type SendEmailParams = {
  name: string;
  email: string;
  organisation?: string;
  enquiryType: string;
  subject: string;
  message: string;
};

export async function sendContactEmail(
  params: SendEmailParams,
  clientOverride?: Resend
): Promise<EmailServiceResult> {
  const referenceId = generateReferenceId();
  const { config, error: configError } = getEmailConfig();

  if (configError || !config) {
    logEmailFailure({
      referenceId,
      provider: "Resend",
      category: "CONFIG_MISSING",
      developerDiagnostic: configError || "Email configuration missing.",
    });
    return {
      success: false,
      referenceId,
      statusCode: 503,
      userMessage: "The contact form is currently unavailable due to server configuration. Please reach out via LinkedIn.",
      category: "CONFIG_MISSING",
      developerDiagnostic: configError,
    };
  }

  const { text, html } = buildContactEmailContent(params);
  const client = clientOverride || new Resend(config.apiKey);

  try {
    const response = await client.emails.send({
      from: config.fromEmail,
      to: [config.toEmail],
      replyTo: params.email,
      subject: `[Portfolio] ${params.enquiryType}: ${params.subject}`,
      text,
      html,
    });

    if (response.error) {
      const mapped = mapResendError(response.error, referenceId, {
        fromEmail: config.fromEmail,
        toEmail: config.toEmail,
      });

      logEmailFailure({
        referenceId,
        provider: "Resend",
        category: mapped.category,
        providerStatusCode: response.error.statusCode,
        providerErrorName: response.error.name,
        providerErrorMessage: response.error.message,
        recipientMasked: maskEmail(config.toEmail),
        senderMasked: maskEmail(config.fromParsed.email),
        developerDiagnostic: mapped.developerDiagnostic,
      });

      return {
        success: false,
        referenceId,
        statusCode: mapped.statusCode,
        userMessage: mapped.userMessage,
        category: mapped.category,
        developerDiagnostic: mapped.developerDiagnostic,
      };
    }

    // Require valid email ID from Resend
    if (!response.data || !response.data.id) {
      logEmailFailure({
        referenceId,
        provider: "Resend",
        category: "UNKNOWN_ERROR",
        developerDiagnostic: "Resend did not return a valid email ID despite no explicit error.",
      });

      return {
        success: false,
        referenceId,
        statusCode: 502,
        userMessage: "The email provider did not confirm message transmission. Please try again later.",
        category: "UNKNOWN_ERROR",
        developerDiagnostic: "Missing data.id in Resend response.",
      };
    }

    return {
      success: true,
      emailId: response.data.id,
    };
  } catch (thrownError: unknown) {
    const errorObj = thrownError instanceof Error ? thrownError : new Error(String(thrownError));
    const isNetworkError =
      errorObj.message.includes("fetch failed") ||
      errorObj.message.includes("ENOTFOUND") ||
      errorObj.message.includes("ETIMEDOUT") ||
      errorObj.message.includes("ECONNRESET");

    const category: EmailFailureCategory = isNetworkError ? "PROVIDER_UNAVAILABLE" : "UNKNOWN_ERROR";
    const statusCode = isNetworkError ? 503 : 500;
    const userMessage = isNetworkError
      ? "Could not connect to the email provider network. Please check your connection or try again shortly."
      : "An internal server error occurred while sending your message. Please try again later.";

    logEmailFailure({
      referenceId,
      provider: "Resend",
      category,
      providerErrorMessage: errorObj.message,
      developerDiagnostic: `Exception during Resend client send: ${errorObj.stack || errorObj.message}`,
    });

    return {
      success: false,
      referenceId,
      statusCode,
      userMessage,
      category,
      developerDiagnostic: errorObj.message,
    };
  }
}
