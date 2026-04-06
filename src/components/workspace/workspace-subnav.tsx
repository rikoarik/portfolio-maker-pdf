"use client";

const NAV: { id: string; label: string; icon: string }[] = [
  { id: "ws-screens", label: "Bukti", icon: "upload" },
  { id: "ws-ai", label: "Analisis AI", icon: "sparkles" },
  { id: "ws-content", label: "Konten", icon: "edit" },
  { id: "ws-studies", label: "Studi kasus", icon: "book" },
  { id: "ws-preview", label: "Pratinjau", icon: "eye" },
  { id: "ws-export", label: "Unduh PDF", icon: "download" },
];

const ICONS: Record<string, React.ReactNode> = {
  upload: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  sparkles: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  edit: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  ),
  book: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  eye: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
};

export function WorkspaceSubnav() {
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      className="sticky top-0 z-30 -mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-zinc-200 bg-[#fafafa]/95 px-1 py-2 backdrop-blur-xl no-scrollbar"
      aria-label="Bagian workspace"
    >
      {NAV.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onClick={() => go(item.id)}
          className="group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition-all hover:bg-white hover:text-zinc-900 hover:shadow-sm"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 transition-all group-hover:bg-indigo-50 group-hover:text-indigo-600">
            {ICONS[item.icon]}
          </span>
          <span className="hidden sm:inline">{item.label}</span>
          <span className="sm:hidden text-[10px] text-zinc-400 font-semibold">{idx + 1}</span>
        </button>
      ))}
    </nav>
  );
}
