import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PengelolaShell } from "../components/pengelola-portal";
import { getPengelolaProfile } from "@/lib/pengelola-data";
import { getPengelolaSession } from "@/lib/pengelola-session";

export const instant = false;

async function PengelolaSessionLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getPengelolaSession();
  if (!session) redirect("/pengelola/login");

  const profile = await getPengelolaProfile(session.pengelolaId);
  if (!profile) redirect("/pengelola/login");

  return <PengelolaShell profile={profile}>{children}</PengelolaShell>;
}

export default function PengelolaPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<main className="pengelola-loading">Memuat Portal Pengelola Toko...</main>}>
      <PengelolaSessionLayout>{children}</PengelolaSessionLayout>
    </Suspense>
  );
}
