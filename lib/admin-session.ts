import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const ADMIN_SESSION_COOKIE = "toko_farid_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type AdminSession = {
  adminId: string;
  expiresAt: number;
};

function getSigningKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("Set AUTH_SECRET or DATABASE_URL to sign Admin sessions.");
  }

  return createHmac("sha256", secret)
    .update("toko-farid-admin-session-v1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
}

export function createAdminSession(adminId: string) {
  const session: AdminSession = {
    adminId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseAdminSession(token?: string, currentTimestamp?: number): AdminSession | null {
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  try {
    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return null;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;
    const now = currentTimestamp ?? Math.floor(Date.now() / 1000);
    if (
      typeof session.adminId !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= now
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return parseAdminSession(token, Math.floor(Date.now() / 1000));
}

export async function setAdminSessionCookie(session: string, remember = false) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? SESSION_TTL_SECONDS * 7 : SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
