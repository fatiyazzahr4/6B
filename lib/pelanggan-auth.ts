import "server-only";
import { redirect } from "next/navigation";
import { getPelangganProfile } from "@/lib/pelanggan-data";
import { getPelangganSession } from "@/lib/pelanggan-session";

export async function requirePelangganProfile() {
  const session = await getPelangganSession();
  if (!session) redirect("/pelanggan/login");

  const profile = await getPelangganProfile(session.pelangganId);
  if (!profile) redirect("/pelanggan/login");

  return profile;
}

export async function redirectIfPelangganSignedIn() {
  const session = await getPelangganSession();
  if (!session) return;

  const profile = await getPelangganProfile(session.pelangganId);
  if (profile) redirect("/pelanggan");
}

