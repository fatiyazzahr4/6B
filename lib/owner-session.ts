import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const OWNER_SESSION_COOKIE = "toko_farid_owner_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type OwnerProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  role: "Owner";
};

export type OwnerSession = {
  ownerId: string;
  expiresAt: number;
  preview?: boolean;
  profile?: OwnerProfile;
};

function getSigningKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("Set AUTH_SECRET or DATABASE_URL to sign Owner sessions.");
  }

  return createHmac("sha256", secret)
    .update("toko-farid-owner-session-v1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
}

export function createOwnerSession(
  ownerId: string,
  options: { preview?: boolean; profile?: OwnerProfile } = {},
) {
  const session: OwnerSession = {
    ownerId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    ...options,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseOwnerSession(token?: string, currentTimestamp?: number): OwnerSession | null {
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
    ) as OwnerSession;
    const now = currentTimestamp ?? Math.floor(Date.now() / 1000);
    if (
      typeof session.ownerId !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= now
    ) {
      return null;
    }
    if (session.preview && process.env.NODE_ENV === "production") return null;

    return session;
  } catch {
    return null;
  }
}

export async function getOwnerSession() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_SESSION_COOKIE)?.value;
  return parseOwnerSession(token, Math.floor(Date.now() / 1000));
}

export async function setOwnerSessionCookie(session: string, remember = false) {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? SESSION_TTL_SECONDS * 7 : SESSION_TTL_SECONDS,
  });
}

export async function clearOwnerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_SESSION_COOKIE);
}
