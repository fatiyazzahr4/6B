import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { getKasirSession } from "@/lib/kasir-session";
import { getOwnerSession } from "@/lib/owner-session";
import TransactionPage from "./transaction-page";

export const metadata: Metadata = {
  title: "Transaksi",
};

export default function TransaksiPage() {
  return (
    <Suspense fallback={<main><p>Memeriksa sesi login…</p></main>}>
      <AuthenticatedTransaksiPage />
    </Suspense>
  );
}

async function AuthenticatedTransaksiPage() {
  const [adminSession, kasirSession, ownerSession] = await Promise.all([
    getAdminSession(),
    getKasirSession(),
    getOwnerSession(),
  ]);
  if (!adminSession && !kasirSession && !ownerSession) redirect("/beranda");

  return <TransactionPage />;
}
