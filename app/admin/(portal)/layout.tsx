import { redirect } from "next/navigation";
import { AdminPortalShell } from "../components/admin-portal";
import { getAdminProfile } from "@/lib/admin-data";
import { getAdminSession } from "@/lib/admin-session";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const profile = await getAdminProfile(session.adminId);
  if (!profile) redirect("/admin/login");

  return <AdminPortalShell profile={profile}>{children}</AdminPortalShell>;
}
