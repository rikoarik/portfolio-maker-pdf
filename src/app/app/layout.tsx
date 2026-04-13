import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#fafafa]">
      <AppHeader />
      <div className="mx-auto w-full max-w-none flex-1 px-4 sm:px-6 lg:px-6 pb-16 pt-6">
        {children}
      </div>
    </div>
  );
}
