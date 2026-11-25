import "server-only";
import { createHmac, timingSafeEqual, scryptSync } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "katiso_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const REMEMBERED_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = { username: string; expiresAt: number };

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

export function verifyAdminPassword(password: string): boolean {
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded) return false;
  const [algorithm, salt, storedHash] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHash) return false;
  try {
    const calculated = scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, "hex");
    return expected.length === calculated.length && timingSafeEqual(expected, calculated);
  } catch {
    return false;
  }
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function createAdminSession(username: string, rememberMe = false) {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  const duration = rememberMe ? REMEMBERED_SESSION_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  const payload: SessionPayload = {
    username,
    expiresAt: Math.floor(Date.now() / 1000) + duration,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encoded}.${sign(encoded, secret)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: duration,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.username === (process.env.ADMIN_USERNAME || "katiso") && payload.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
