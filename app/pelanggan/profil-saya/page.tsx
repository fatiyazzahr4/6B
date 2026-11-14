import CustomerPortal from "../components/customer-portal";
import { requirePelangganProfile } from "@/lib/pelanggan-auth";

export const metadata = { title: "Profil Saya" };
export const instant = false;

export default async function CustomerProfilePage() {
  const profile = await requirePelangganProfile();
  return <CustomerPortal page="profile" profile={profile} />;
}
