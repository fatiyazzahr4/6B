import { KasirPage } from "../../components/kasir-portal";

export const metadata = { title: "Transaksi Baru" };

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ pesanan?: string }>;
}) {
  const { pesanan } = await searchParams;
  return <KasirPage page="checkout" orderId={pesanan} />;
}
