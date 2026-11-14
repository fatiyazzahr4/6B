import { CustomerRegistration } from "../components/customer-portal";
import { redirectIfPelangganSignedIn } from "@/lib/pelanggan-auth";

export const metadata = { title: "Registrasi Pelanggan" };
export const instant = false;

export default async function CustomerRegistrationPage() {
  await redirectIfPelangganSignedIn();
  return <CustomerRegistration />;
}
