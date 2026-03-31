import { AppHeader } from "@/components/app-header";

export default function AppAreaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-zinc-50 to-white">
      <AppHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6">
        {children}
      </div>
    </div>
  );
}
