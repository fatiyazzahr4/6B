import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed transaction examples.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    max: 5,
    ssl: process.env.DB_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
  }),
});

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const examples = [
  { id: "TRX-DEMO-001", name: "Beras Premium 5 kg", quantity: 2, price: 68000, daysAgo: 4, cashier: "Dafina Syafitri" },
  { id: "TRX-DEMO-002", name: "Minyak Goreng 1 L", quantity: 4, price: 18000, daysAgo: 3, cashier: "Andi Saputra" },
  { id: "TRX-DEMO-003", name: "Telur Ayam 1 Tray", quantity: 1, price: 52000, daysAgo: 2, cashier: "Dafina Syafitri" },
  { id: "TRX-DEMO-004", name: "Gula Pasir 1 kg", quantity: 3, price: 17000, daysAgo: 1, cashier: "Andi Saputra" },
  { id: "TRX-DEMO-005", name: "Teh Celup 25 Kantong", quantity: 2, price: 12000, daysAgo: 0, cashier: "Dafina Syafitri" },
];

async function seedTransactions() {
  try {
    for (const example of examples) {
      const data = {
        nama_barang: example.name,
        jumlah: example.quantity,
        harga_satuan: example.price.toFixed(2),
        tanggal_transaksi: daysAgo(example.daysAgo),
        nama_kasir: example.cashier,
        total_harga: (example.quantity * example.price).toFixed(2),
      };
      await prisma.transaksi_manual.upsert({
        where: { id_transaksi_manual: example.id },
        update: data,
        create: {
          id_transaksi_manual: example.id,
          ...data,
        },
      });
    }
    console.info(`Seeded ${examples.length} sample transactions.`);
  } finally {
    await prisma.$disconnect();
  }
}

void seedTransactions().catch((error: unknown) => {
  console.error(
    "Transaction seed failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  process.exitCode = 1;
});
