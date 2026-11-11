import CustomerPortal from "../components/customer-portal";

export const metadata = { title: "Pesanan Saya" };

export default function CustomerOrdersPage() {
  return <CustomerPortal page="orders" />;
}
