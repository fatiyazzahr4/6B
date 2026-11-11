import { redirect } from "next/navigation";
import { KasirShell } from "../components/kasir-portal";
import { getKasirProfile } from "@/lib/kasir-data";
import { getKasirSession } from "@/lib/kasir-session";

export const instant = false;

export default async function KasirPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getKasirSession();
  if (!session) redirect("/kasir/login");

  const profile = await getKasirProfile(session.kasirId);
  if (!profile) redirect("/kasir/login");

  return <KasirShell profile={profile}>{children}</KasirShell>;
}
