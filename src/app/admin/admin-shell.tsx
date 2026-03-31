"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  LayoutDashboard,
  Users,
  Webhook,
} from "lucide-react";

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <span className="flex items-center gap-2">
        {Icon ? (
          <Icon
            className={`h-4 w-4 ${
              active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"
            }`}
          />
        ) : null}
        {label}
      </span>
      {active ? (
        <span className="flex h-1.5 w-1.5 rounded-full bg-white/80"></span>
      ) : null}
    </Link>
  );
}

export function AdminShell({
  children,
  userEmail,
}: Readonly<{ children: React.ReactNode; userEmail: string }>) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar (Hidden on mobile) */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <Link href="/admin" className="text-sm font-bold tracking-tight text-zinc-900">
            Admin Console
          </Link>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="space-y-1">
            <NavLink
              href="/admin"
              label="Ringkasan"
              icon={LayoutDashboard}
            />
            <NavLink
              href="/admin/plans"
              label="Plans & limit"
              icon={CreditCard}
            />
            <NavLink href="/admin/users" label="Pengguna" icon={Users} />
            <NavLink href="/admin/audit" label="Audit log" icon={Activity} />
            <NavLink href="/admin/webhooks" label="Webhooks" icon={Webhook} />
          </nav>

          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-600">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-semibold text-indigo-900">Tips Operasional</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-indigo-700/80">
              Perubahan limit pada menu <strong className="font-medium text-indigo-900">Plans</strong> akan langsung berlaku untuk semua user.
            </p>
          </div>
        </div>

        <div className="mt-auto border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-900">{userEmail}</p>
              <p className="truncate text-[10px] text-zinc-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md md:justify-end md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
              </svg>
            </div>
            <Link href="/admin" className="text-sm font-bold tracking-tight text-zinc-900">
              Admin Console
            </Link>
          </div>
          
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Kembali ke App
          </Link>
        </header>

        {/* Mobile Nav (Simple horizontal scroll) */}
        <div className="border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-2 text-sm">
            <NavLink
              href="/admin"
              label="Ringkasan"
              icon={LayoutDashboard}
            />
            <NavLink href="/admin/plans" label="Plans" icon={CreditCard} />
            <NavLink href="/admin/users" label="Pengguna" icon={Users} />
            <NavLink href="/admin/audit" label="Audit" icon={Activity} />
            <NavLink href="/admin/webhooks" label="Webhooks" icon={Webhook} />
          </nav>
        </div>

        <main className="flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

