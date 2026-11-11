import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Toko Farid — Belanja Mudah, Kebutuhan Lengkap",
    template: "%s | Toko Farid",
  },
  description:
    "Toko Farid, supermarket keluarga di Padang. Belanja mudah, kebutuhan lengkap.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={geistSans.variable}
    >
      <body>{children}</body>
    </html>
  );
}
