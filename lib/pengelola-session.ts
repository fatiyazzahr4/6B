import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const PENGELOLA_SESSION_COOKIE = "toko_farid_pengelola_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type PengelolaProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  role: "Pengelola Toko";
};

export type PengelolaSession = {
  pengelolaId: string;
  expiresAt: number;
};

function getSigningKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("Set AUTH_SECRET or DATABASE_URL to sign Pengelola Toko sessions.");
  }

  return createHmac("sha256", secret)
    .update("toko-farid-pengelola-session-v1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
}

export function createPengelolaSession(pengelolaId: string) {
  const session: PengelolaSession = {
    pengelolaId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parsePengelolaSession(token?: string, currentTimestamp?: number): PengelolaSession | null {
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
    ) as PengelolaSession;
    const now = currentTimestamp ?? Math.floor(Date.now() / 1000);
    if (
      typeof session.pengelolaId !== "string" ||
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

export async function getPengelolaSession() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(PENGELOLA_SESSION_COOKIE)?.value;
  return parsePengelolaSession(token, Math.floor(Date.now() / 1000));
}

export async function setPengelolaSessionCookie(session: string, remember = false) {
  const cookieStore = await cookies();
  cookieStore.set(PENGELOLA_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? SESSION_TTL_SECONDS * 7 : SESSION_TTL_SECONDS,
  });
}

export async function clearPengelolaSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PENGELOLA_SESSION_COOKIE);
}
