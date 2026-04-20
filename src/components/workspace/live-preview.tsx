import Image from "next/image";
import type { ProjectResponse } from "@/lib/api";

export function LivePreview({ project }: { project: ProjectResponse }) {
  const draft = project.draft;

  return (
    <div className="flex h-full max-h-[880px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
      <div className="shrink-0 border-b border-zinc-200 bg-zinc-100/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center">
          <div className="flex w-16 gap-1.5">
            <div className="h-3 w-3 rounded-full border border-red-500/20 bg-red-400" />
            <div className="h-3 w-3 rounded-full border border-amber-500/20 bg-amber-400" />
            <div className="h-3 w-3 rounded-full border border-green-500/20 bg-green-400" />
          </div>
          <div className="mx-auto flex flex-1 justify-center">
            <div className="flex w-full max-w-[280px] items-center gap-2 rounded-md border border-zinc-200 bg-white px-6 py-1.5 text-[11px] font-medium text-zinc-500 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span className="truncate">portfolio-maker.io/p/{project.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex w-16 justify-end">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 opacity-0 transition-opacity group-hover:opacity-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3 text-zinc-500"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto scroll-smooth bg-zinc-50 p-6 sm:p-10">
        <div className="relative mb-12">
          {draft.templateId ? (
            <div className="absolute -top-4 -left-4 -z-10 text-9xl font-bold text-zinc-200 opcaity-5">
              {draft.templateId.charAt(0).toUpperCase()}
            </div>
          ) : null}
          <h1 className="mb-6 text-3xl font-black leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
            {project.title || "Tanpa Judul"}
          </h1>
          {project.jobFocus ? (
            <div className="mb-6 inline-flex items-center rounded-md bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              {project.jobFocus}
            </div>
          ) : null}
          <p className="relative z-10 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-zinc-600 sm:text-lg">
            {draft.projectSummary ||
              "Ringkasan proyek Anda akan disusun di sini. Ketik selengkapnya di form sebelah kiri untuk melihat preview..."}
          </p>

          {draft.techStack.length > 0 ? (
            <div className="mt-4 flex max-w-2xl flex-wrap gap-2 border-t border-zinc-200/60 pt-8">
              {draft.techStack.map((tech, index) => (
                <span
                  key={index}
                  className="rounded border border-zinc-200/80 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {project.screenshots.length > 0 ? (
          <div className="mb-12">
            <h3 className="text-tracking-tight mb-6 text-2xl font-black text-zinc-900">
              Interface Pintar
            </h3>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
              {project.screenshots.map((screenshot, index) => (
                <div
                  key={screenshot.id}
                  className="group relative aspect-[9/16] cursor-default overflow-hidden rounded-2xl border border-zinc-200/50 bg-white shadow-md transition-all duration-500 hover:shadow-xl"
                >
                  <Image
                    src={screenshot.previewUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3 flex h-6 w-6 translate-y-4 items-center justify-center rounded-full bg-white/95 text-xs font-bold text-zinc-900 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(draft.sections ?? []).length > 0 ? (
          <div className="space-y-8">
            <h3 className="text-tracking-tight mb-2 text-2xl font-black text-zinc-900">
              Penjelasan Detail
            </h3>
            {(draft.sections ?? []).map((section) => (
              <div
                key={section.id}
                className="group rounded-2xl border border-zinc-200/60 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 opacity-50 transition-opacity group-hover:opacity-100" />
                  {section.label || "Section Baru"}
                </h3>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-600">
                  {section.content || "Belum ada konten."}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
