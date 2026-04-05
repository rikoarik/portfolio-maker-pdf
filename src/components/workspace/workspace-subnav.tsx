"use client";

const NAV: { id: string; label: string }[] = [
  { id: "ws-screens", label: "Bukti & unggah" },
  { id: "ws-ai", label: "Analisis AI" },
  { id: "ws-content", label: "Konten" },
  { id: "ws-studies", label: "Studi kasus" },
  { id: "ws-preview", label: "Pratinjau" },
  { id: "ws-export", label: "Unduh PDF" },
];

export function WorkspaceSubnav() {
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      className="sticky top-0 z-30 -mx-1 mb-8 flex flex-wrap gap-1 border-b border-zinc-200 bg-[var(--background)]/95 px-1 py-2 backdrop-blur-sm"
      aria-label="Bagian workspace"
    >
      {NAV.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => go(item.id)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
