"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./transaction-page.module.css";

type Transaction = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  date: string;
  cashier: string;
};

type TransactionPageData = {
  transactions: Transaction[];
  summary: { transactionCount: number; totalValue: number };
  currentCashier: string | null;
  canCreate: boolean;
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const transactionDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function localDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return transactionDate.format(new Date(year, month - 1, day));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function requestApiData<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("Tidak dapat terhubung ke server transaksi. Periksa koneksi lalu coba lagi.");
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca.");
  }

  if (isRecord(payload) && payload.success === false &&
    typeof payload.message === "string") {
    throw new Error(payload.message);
  }
  if (!response.ok || !isRecord(payload) || payload.success !== true ||
    !("data" in payload)) {
    throw new Error("Server mengirim respons yang tidak valid.");
  }
  return payload.data as T;
}

function loadTransactions() {
  return requestApiData<TransactionPageData>("/api/transaksi", {
    cache: "no-store",
  });
}

function SummaryIcon({ kind }: { kind: "count" | "value" }) {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round"
      strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {kind === "count"
        ? <><path d="M4 19V5m0 14h16" /><path d="m7 15 4-4 3 2 5-6" /><circle cx="7" cy="15" r="1" /><circle cx="11" cy="11" r="1" /><circle cx="14" cy="13" r="1" /><circle cx="19" cy="7" r="1" /></>
        : <><rect height="16" rx="3" width="20" x="2" y="4" /><path d="M7 9h10M7 13h3" /><circle cx="16" cy="15" r="2" /></>}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round"
      strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function TransactionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ transactionCount: 0, totalValue: 0 });
  const [currentCashier, setCurrentCashier] = useState<string | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [today, setToday] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    loadTransactions()
      .then((data) => {
        if (!active) return;
        setTransactions(data.transactions);
        setSummary(data.summary);
        setCurrentCashier(data.currentCashier);
        setCanCreate(data.canCreate);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error
            ? cause.message
            : "Transaksi tidak dapat dimuat. Silakan coba lagi.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsModalOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isModalOpen]);

  async function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productName = String(form.get("productName") ?? "").trim();
    const quantity = String(form.get("quantity") ?? "");
    const unitPrice = String(form.get("unitPrice") ?? "");
    const date = String(form.get("date") ?? "");
    const cashier = String(form.get("cashier") ?? "").trim();

    setIsSaving(true);
    setFormError("");
    setError("");
    let saved = false;
    try {
      await requestApiData<Transaction>("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, quantity, unitPrice, date, cashier }),
      });
      saved = true;
      setIsModalOpen(false);
      const data = await loadTransactions();
      setTransactions(data.transactions);
      setSummary(data.summary);
      setCurrentCashier(data.currentCashier);
      setCanCreate(data.canCreate);
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : "Transaksi tidak dapat disimpan. Silakan coba lagi.";
      if (saved) {
        setError(`Transaksi berhasil disimpan, tetapi daftar gagal dimuat ulang. ${message}`);
      } else {
        setFormError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.pageHeader}>
          <div className={styles.headingCopy}>
            <span className={styles.eyebrow}>TOKO FARID · OPERASIONAL</span>
            <h1>Transaksi</h1>
            <p>Pantau ringkasan penjualan dan transaksi toko.</p>
          </div>
          {canCreate && (
            <button className={styles.addButton} onClick={() => {
              setToday(localDateValue());
              setFormError("");
              setIsModalOpen(true);
            }} type="button">
              <span aria-hidden="true">+</span> Tambah Transaksi
            </button>
          )}
        </header>

        {error && <p className={styles.errorBanner} role="alert">{error}</p>}

        <section aria-label="Ringkasan transaksi" className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.countIcon}`}><SummaryIcon kind="count" /></span>
            <div><p>Jumlah Transaksi</p><strong>{isLoading ? "…" : summary.transactionCount.toLocaleString("id-ID")}</strong><small>Seluruh transaksi</small></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={`${styles.summaryIcon} ${styles.valueIcon}`}><SummaryIcon kind="value" /></span>
            <div><p>Total Nilai Transaksi</p><strong>{isLoading ? "…" : currency.format(summary.totalValue)}</strong><small>Akumulasi nilai transaksi</small></div>
          </article>
        </section>

        <section aria-labelledby="transaction-list-title" className={styles.tableCard}>
          <div className={styles.tableHeading}>
            <div><h2 id="transaction-list-title">Daftar Transaksi</h2><p>Catatan transaksi penjualan toko.</p></div>
            <span className={styles.recordCount}>{isLoading ? "Memuat…" : `${summary.transactionCount} transaksi`}</span>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Nama Barang</th>
                  <th scope="col">Jumlah</th>
                  <th scope="col">Harga Satuan</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Kasir</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <tr><td className={styles.emptyState} colSpan={5}>Memuat transaksi…</td></tr>
                  : transactions.length === 0
                    ? <tr><td className={styles.emptyState} colSpan={5}>{error ? "Transaksi tidak dapat dimuat." : "Belum ada transaksi"}</td></tr>
                  : transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td><span className={styles.productMark} aria-hidden="true">{transaction.productName.slice(0, 1).toUpperCase()}</span><strong>{transaction.productName}</strong></td>
                      <td>{transaction.quantity}</td>
                      <td>{currency.format(transaction.unitPrice)}</td>
                      <td>{formatDate(transaction.date)}</td>
                      <td><span className={styles.cashier}><span>{transaction.cashier.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>{transaction.cashier}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsModalOpen(false);
        }}>
          <section aria-labelledby="transaction-form-title" aria-modal="true" className={styles.modal} role="dialog">
            <header className={styles.modalHeader}>
              <div><span className={styles.modalEyebrow}>CATAT PENJUALAN</span><h2 id="transaction-form-title">Tambah Transaksi</h2><p>Lengkapi detail transaksi di bawah ini.</p></div>
              <button aria-label="Tutup form" className={styles.closeButton} onClick={() => setIsModalOpen(false)} type="button"><CloseIcon /></button>
            </header>
            <form className={styles.form} onSubmit={addTransaction}>
              <label className={styles.field}>
                <span>Nama Barang</span>
                <input autoComplete="off" maxLength={100} name="productName" placeholder="Contoh: Beras Premium 5 kg" required />
              </label>
              <div className={styles.formRow}>
                <label className={styles.field}>
                  <span>Jumlah</span>
                  <input min="1" name="quantity" placeholder="0" required step="1" type="number" />
                </label>
                <label className={styles.field}>
                  <span>Harga Satuan</span>
                  <span className={styles.currencyInput}><span>Rp</span><input min="0" name="unitPrice" placeholder="0" required step="0.01" type="number" /></span>
                </label>
              </div>
              <div className={styles.formRow}>
                <label className={styles.field}>
                  <span>Tanggal</span>
                  <input defaultValue={today} name="date" type="date" />
                </label>
                <label className={styles.field}>
                  <span>Kasir</span>
                  <input autoComplete="name" defaultValue={currentCashier ?? ""} maxLength={100} name="cashier" placeholder="Nama kasir" readOnly={Boolean(currentCashier)} required />
                </label>
              </div>
              {formError && <p className={styles.formError} role="alert">{formError}</p>}
              <footer className={styles.formActions}>
                <button className={styles.cancelButton} onClick={() => setIsModalOpen(false)} type="button">Batal</button>
                <button className={styles.saveButton} disabled={isSaving} type="submit">{isSaving ? "Menyimpan…" : "Simpan Transaksi"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
