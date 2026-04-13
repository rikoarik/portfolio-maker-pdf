import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harga & paket",
  description:
    "Paket gratis dan Pro untuk Portfolio Maker: kuota proyek, screenshot, analisis AI, dan ekspor PDF yang jelas per periode.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Harga & paket · Portfolio Maker",
    description:
      "Pilih paket gratis atau Pro dengan kuota jelas untuk portofolio PDF dari screenshot.",
    url: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
