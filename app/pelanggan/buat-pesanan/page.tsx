import CustomerPortal from "../components/customer-portal";
import { requirePelangganProfile } from "@/lib/pelanggan-auth";

export const metadata = { title: "Buat Pesanan" };
export const instant = false;

export default async function CustomerOrderPage() {
  const profile = await requirePelangganProfile();
  return <CustomerPortal page="order" profile={profile} />;
}
