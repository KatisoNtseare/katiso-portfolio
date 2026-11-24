import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendContactEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. IP extraction for rate limiting
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const clientIp = forwarded || realIp || "127.0.0.1";

  const rate = checkRateLimit(`contact:${clientIp}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { message: "Too many messages have been submitted from your network. Please wait a while before trying again." },
      { status: 429 }
    );
  }

  // 2. Safe JSON Body Parsing
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request payload. Please submit a valid form." },
      { status: 400 }
    );
  }

  // 3. Schema Validation
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message || "Please check the form fields and try again.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  // 4. Honeypot check: silently accept bots without sending email
  if (parsed.data.website) {
    return NextResponse.json(
      { message: "Your message has been submitted successfully. Thank you for getting in touch." },
      { status: 200 }
    );
  }

  // 5. Send Email via Resend Service
  const result = await sendContactEmail(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      {
        message: result.userMessage,
        referenceId: result.referenceId,
      },
      { status: result.statusCode }
    );
  }

  return NextResponse.json(
    {
      message: "Your message has been submitted successfully. Thank you for getting in touch.",
      emailId: result.emailId,
    },
    { status: 200 }
  );
}
