import CustomerPortal from "../components/customer-portal";
import { requirePelangganProfile } from "@/lib/pelanggan-auth";

export const metadata = { title: "Pesanan Saya" };
export const instant = false;

export default async function CustomerOrdersPage() {
  const profile = await requirePelangganProfile();
  return <CustomerPortal page="orders" profile={profile} />;
}
