import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Periksa email",
  robots: { index: false, follow: false },
};

export default function CheckEmailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
