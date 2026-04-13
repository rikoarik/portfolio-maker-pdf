import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa kata sandi",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
