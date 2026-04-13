import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { getSiteUrl } from "@/lib/site";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const defaultTitle = "Portfolio Maker — Buat CV & Portofolio dengan AI";
const defaultDescription =
  "Ubah screenshot aplikasi menjadi portofolio PDF profesional dalam hitungan menit. Didukung AI Gemini untuk menghasilkan teks berkualitas tinggi.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Portfolio Maker",
  title: {
    default: defaultTitle,
    template: "%s · Portfolio Maker",
  },
  description: defaultDescription,
  keywords: [
    "portfolio",
    "CV",
    "AI",
    "PDF",
    "portofolio",
    "maker",
    "lamar kerja",
    "Gemini",
  ],
  authors: [{ name: "Portfolio Maker" }],
  creator: "Portfolio Maker",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl.href,
    siteName: "Portfolio Maker",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Portfolio Maker — Buat CV & portofolio dengan AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans antialiased">
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
