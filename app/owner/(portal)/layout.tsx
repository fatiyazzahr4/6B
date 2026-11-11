import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { OwnerPortalShell } from "../components/owner-portal";
import { getOwnerProfile } from "@/lib/owner-data";
import { getOwnerSession } from "@/lib/owner-session";
import { ownerDemoData } from "@/lib/owner-data";

export const instant = false;

async function OwnerSessionLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getOwnerSession();
  if (!session) redirect("/owner/login");

  const profile = session.preview
    ? session.profile ?? ownerDemoData.profile
    : await getOwnerProfile(session.ownerId);
  if (!profile) redirect("/owner/login");

  return <OwnerPortalShell profile={profile} preview={Boolean(session.preview)}>{children}</OwnerPortalShell>;
}

export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  return (
    <Suspense fallback={<main className="owner-loading">Memuat Portal Owner...</main>}>
      <OwnerSessionLayout>{children}</OwnerSessionLayout>
    </Suspense>
  );
}
