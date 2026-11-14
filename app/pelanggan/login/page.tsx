import { CustomerLogin } from "../components/customer-portal";
import { redirectIfPelangganSignedIn } from "@/lib/pelanggan-auth";

export const metadata = { title: "Login Pelanggan" };
export const instant = false;

export default async function CustomerLoginPage() {
  await redirectIfPelangganSignedIn();
  return <CustomerLogin />;
}
