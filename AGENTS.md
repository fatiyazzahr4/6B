<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

# Toko Farid project guide

## Project overview

Toko Farid is a role-based store application built with Next.js App Router, React, TypeScript, PostgreSQL, and Prisma ORM 7. Preserve existing login and role workflows when changing unrelated pages.

## Main structure

- `app/`: App Router pages, API routes, and page-specific components/styles.
- `app/api/`: Admin, Kasir, Owner, Pengelola, health, and transaction endpoints.
- `lib/`: Prisma singleton, role sessions, and data access helpers.
- `prisma/schema.prisma`: PostgreSQL data model.
- `prisma/seed.ts`: idempotent examples for direct transaction records.
- `prisma7.config.ts`: Prisma 7 schema, database URL, and seed configuration.
- `public/`: static product and storefront assets.

## API endpoints

| Endpoint | Methods | Access and purpose |
|---|---|---|
| `/api/health` | GET | Read-only database health check and account count. |
| `/api/transaksi` | GET, POST | Admin, Kasir, and Owner can read. Admin and Kasir can add direct transactions; Owner is read-only. Combines direct records with existing Kasir transaction lines. |
| `/api/admin` | GET, POST | Admin session; dashboard, profile, accounts, products, reports, and backup metadata/actions. |
| `/api/kasir` | GET, POST | Kasir session; dashboard, profile, catalog, orders, transactions, payments, and receipts. |
| `/api/owner` | GET, POST | Owner session; dashboard, profile, stock, transaction/sales reports, and archives. |
| `/api/pengelola` | GET, POST | Pengelola session; dashboard, profile, stock, locations, notifications, and history. |

The role APIs use a `view` query parameter for reads and an `action` field for writes. They return role-appropriate errors when a session is missing or an operation is not allowed. Do not add a public data endpoint or weaken an existing role check.

### Transaction API contract

`GET /api/transaksi` returns `{ "success": true, "data": { "transactions": [], "summary": { "transactionCount": 0, "totalValue": 0 }, "currentCashier": null, "canCreate": true } }`.

`POST /api/transaksi` accepts JSON:

```json
{
  "productName": "Teh Celup",
  "quantity": 2,
  "unitPrice": "12000",
  "date": "2026-11-11",
  "cashier": "Nama Kasir"
}
```

Success is HTTP 201 with `{ "success": true, "data": { "id": "...", "productName": "Teh Celup", "quantity": 2, "unitPrice": 12000, "date": "2026-11-11", "cashier": "Nama Kasir", "total": 24000 } }`. Errors use `{ "success": false, "message": "..." }`.

Transaction rules:

- Product name and cashier are required and limited to 100 characters.
- Quantity must be a positive whole number.
- Unit price must be non-negative with at most two decimal places and fit the database numeric range.
- An omitted/empty date defaults to today; an invalid calendar date is rejected.
- A Kasir's server-side session name takes precedence over a submitted cashier name.
- Total is calculated and stored by the server as quantity multiplied by unit price.
- Database summaries use aggregate counts and totals; clients do not submit trusted totals.
- Unauthenticated requests receive 401; Owner write requests receive 403; invalid input receives 400.

## Prisma models

Models in `prisma/schema.prisma`: `admin`, `akun`, `alamat`, `backup_data`, `barang`, `data_akun`, `detail_pesanan`, `detail_transaksi`, `kasir`, `kasir_operator`, `kode_pos`, `laporan`, `lokasi`, `notifikasi_stok`, `owner`, `pelanggan`, `pembayaran`, `pengelola_toko`, `pengguna`, `pesanan`, `registrasi`, `riwayat_stok`, `stok`, `struk`, `transaksi`, and `transaksi_manual`.

`transaksi_manual` stores the standalone form fields without changing the existing order-based Kasir transaction relations. The transaction API combines both sources for listing and summary totals.

## Environment and local development

Required/recognized environment variable names: `DATABASE_URL`, `DB_SSL`, `AUTH_SECRET`, and `NODE_ENV`. Never put actual secret values in documentation or source control. Use `.env.example` as a variable-name template; `.env` and `.env.local` are private.

Typical local setup:

```powershell
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

The local PostgreSQL service must be running and reachable through `DATABASE_URL`. `npm run lint` and `npm run build` are the project checks.

There is currently no project `Dockerfile` or Docker Compose file. Docker does not provision PostgreSQL for this repository; configure a local PostgreSQL service separately and keep its credentials in an ignored environment file.

## UI and data safety

- Preserve existing role login screens, authentication, and shared/global styling.
- Keep new page styling scoped (for example with CSS Modules) to avoid changes to other roles.
- Do not edit `database.sql`, the Prisma schema, or database configuration without explicit user approval.
- Never reset, drop, or overwrite database contents without explicit user approval.
- Do not commit credentials, session tokens, `.env`, or `.env.local`.

## Recent change

The `/transaksi` page now reads and creates records through `/api/transaksi`. An additive `transaksi_manual` model was approved, pushed to the local database, and seeded with five idempotent examples. The page redirects unauthenticated visitors to `/beranda`; Admin/Kasir can create records and Owner can read only.

## Neon and Vercel

The approved Neon project is `toko-farid-6b` in `aws-ap-southeast-1` (Singapore). Keep the pooled Neon URL in runtime `DATABASE_URL` and the direct Neon URL in `DIRECT_URL`; both must use `sslmode=require`. Preserve the original local PostgreSQL URL as `DATABASE_URL_LOCAL`. `prisma7.config.ts` prefers `DIRECT_URL` for schema operations and falls back to `DATABASE_URL` for local development.

`database/neon-seed.sql` is an idempotent SQL backup of the five sample transaction rows. The matching Prisma seed is `npx prisma db seed`. On Vercel, configure `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, and `DB_SSL` for Production, Preview, and Development without committing or printing their values. Use the pooled URL for runtime and direct URL for Prisma schema changes.
