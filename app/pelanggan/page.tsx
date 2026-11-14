import CustomerPortal from "./components/customer-portal";
import { requirePelangganProfile } from "@/lib/pelanggan-auth";

export const metadata = { title: "Dashboard Pelanggan" };
export const instant = false;

export default async function CustomerDashboardPage() {
  const profile = await requirePelangganProfile();
  return <CustomerPortal page="dashboard" profile={profile} />;
}
