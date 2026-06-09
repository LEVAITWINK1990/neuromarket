import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { DemoStoreProvider } from "@/lib/demo-store";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NeuroMarket Greenfield",
  description: "Fresh marketplace build for AI subscriptions, vouchers, credits, and services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} font-sans antialiased`}>
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
