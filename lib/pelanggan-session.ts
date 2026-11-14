import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const PELANGGAN_SESSION_COOKIE = "toko_farid_pelanggan_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type PelangganProfile = {
  id: string;
  accountId: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  role: "Pelanggan";
};

export type PelangganSession = {
  pelangganId: string;
  expiresAt: number;
};

function getSigningKey() {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!secret) {
    throw new Error("Set AUTH_SECRET or DATABASE_URL to sign Pelanggan sessions.");
  }

  return createHmac("sha256", secret)
    .update("toko-farid-pelanggan-session-v1")
    .digest();
}

function sign(payload: string) {
  return createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
}

export function createPelangganSession(pelangganId: string) {
  const session: PelangganSession = {
    pelangganId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parsePelangganSession(
  token?: string,
  currentTimestamp?: number,
): PelangganSession | null {
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
    ) as PelangganSession;
    const now = currentTimestamp ?? Math.floor(Date.now() / 1000);
    if (
      typeof session.pelangganId !== "string" ||
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

export async function getPelangganSession() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(PELANGGAN_SESSION_COOKIE)?.value;
  return parsePelangganSession(token, Math.floor(Date.now() / 1000));
}

export async function setPelangganSessionCookie(session: string, remember = false) {
  const cookieStore = await cookies();
  cookieStore.set(PELANGGAN_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? SESSION_TTL_SECONDS * 7 : SESSION_TTL_SECONDS,
  });
}

export async function clearPelangganSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PELANGGAN_SESSION_COOKIE);
}

