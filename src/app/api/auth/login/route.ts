import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`login:${forwarded}`, 6, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ message: "Too many sign-in attempts. Try again later." }, { status: 429 });
  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return NextResponse.json({ message: "Admin access is not configured. Follow the setup instructions in README.md." }, { status: 503 });
  }
  try {
    const body = await request.json() as { username?: string; password?: string; rememberMe?: boolean };
    if (body.rememberMe !== undefined && typeof body.rememberMe !== "boolean") {
      return NextResponse.json({ message: "Invalid sign-in options." }, { status: 400 });
    }
    const expectedUsername = process.env.ADMIN_USERNAME || "katiso";
    if (body.username !== expectedUsername || typeof body.password !== "string" || !verifyAdminPassword(body.password)) {
      return NextResponse.json({ message: "The username or password is incorrect." }, { status: 401 });
    }
    await createAdminSession(expectedUsername, body.rememberMe === true);
    return NextResponse.json({ message: "Signed in successfully." });
  } catch {
    return NextResponse.json({ message: "The sign-in request could not be processed." }, { status: 400 });
  }
}
