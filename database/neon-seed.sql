BEGIN;

INSERT INTO "transaksi_manual" (
  "id_transaksi_manual",
  "nama_barang",
  "jumlah",
  "harga_satuan",
  "tanggal_transaksi",
  "nama_kasir",
  "total_harga"
)
VALUES
  ('TRX-DEMO-001', 'Beras Premium 5 kg', 2, 68000.00, (CURRENT_DATE - INTERVAL '4 days')::date, 'Dafina Syafitri', 136000.00),
  ('TRX-DEMO-002', 'Minyak Goreng 1 L', 4, 18000.00, (CURRENT_DATE - INTERVAL '3 days')::date, 'Andi Saputra', 72000.00),
  ('TRX-DEMO-003', 'Telur Ayam 1 Tray', 1, 52000.00, (CURRENT_DATE - INTERVAL '2 days')::date, 'Dafina Syafitri', 52000.00),
  ('TRX-DEMO-004', 'Gula Pasir 1 kg', 3, 17000.00, (CURRENT_DATE - INTERVAL '1 day')::date, 'Andi Saputra', 51000.00),
  ('TRX-DEMO-005', 'Teh Celup 25 Kantong', 2, 12000.00, CURRENT_DATE, 'Dafina Syafitri', 24000.00)
ON CONFLICT ("id_transaksi_manual") DO UPDATE SET
  "nama_barang" = EXCLUDED."nama_barang",
  "jumlah" = EXCLUDED."jumlah",
  "harga_satuan" = EXCLUDED."harga_satuan",
  "tanggal_transaksi" = EXCLUDED."tanggal_transaksi",
  "nama_kasir" = EXCLUDED."nama_kasir",
  "total_harga" = EXCLUDED."total_harga";

COMMIT;
