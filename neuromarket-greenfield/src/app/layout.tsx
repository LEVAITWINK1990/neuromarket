import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import "./globals.css";
import { DemoStoreProvider } from "@/lib/demo-store";

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
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
      <body className={`${roboto.variable} font-sans antialiased`}>
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
