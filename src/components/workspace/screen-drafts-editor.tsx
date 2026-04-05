"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import type { UseMutationResult } from "@tanstack/react-query";

type Props = {
  qc: QueryClient;
  projectId: string;
  project: ProjectResponse;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
  retryMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
};

export function ScreenDraftsEditor({
  qc,
  projectId,
  project,
  saveDraft,
  retryMut,
}: Props) {
  const draft = project.draft;

  return (
    <div className="mt-3 space-y-6">
      {draft.screens.map((sc, sci) => {
        const shot = project.screenshots.find((x) => x.id === sc.assetId);
        const si = project.screenshots.findIndex((x) => x.id === sc.assetId);
        return (
          <div
            key={sc.assetId}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start gap-3">
              {shot ? (
                <div className="h-24 w-14 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.previewUrl}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-xs text-zinc-500">
                    {si >= 0 ? `Layar ${si + 1}` : "Layar"}
                  </span>
                  {shot?.analysisStatus === "failed" ? (
                    <button
                      type="button"
                      disabled={retryMut.isPending}
                      onClick={() => retryMut.mutate(shot.id)}
                      className="text-xs text-indigo-600 underline"
                    >
                      Coba analisis lagi
                    </button>
                  ) : null}
                </div>
                <label className="mt-2 block text-xs text-zinc-500">Judul</label>
                <input
                  className="mt-0.5 w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                  value={sc.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    qc.setQueryData(
                      ["project", projectId],
                      (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const screens = [...old.draft.screens];
                        screens[sci] = { ...screens[sci], title };
                        return {
                          ...old,
                          draft: { ...old.draft, screens },
                        };
                      },
                    );
                  }}
                  onBlur={() => {
                    const d = qc.getQueryData(["project", projectId]) as
                      | ProjectResponse
                      | undefined;
                    if (d) saveDraft.mutate(d.draft);
                  }}
                />
                <label className="mt-2 block text-xs text-zinc-500">
                  Poin (satu baris = satu bullet)
                </label>
                <textarea
                  className="mt-0.5 min-h-[72px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                  value={sc.bullets.join("\n")}
                  onChange={(e) => {
                    const bullets = e.target.value
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean);
                    qc.setQueryData(
                      ["project", projectId],
                      (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const screens = [...old.draft.screens];
                        screens[sci] = { ...screens[sci], bullets };
                        return {
                          ...old,
                          draft: { ...old.draft, screens },
                        };
                      },
                    );
                  }}
                  onBlur={() => {
                    const d = qc.getQueryData(["project", projectId]) as
                      | ProjectResponse
                      | undefined;
                    if (d) saveDraft.mutate(d.draft);
                  }}
                />
                <label className="mt-2 block text-xs text-zinc-500">
                  Catatan
                </label>
                <textarea
                  className="mt-0.5 min-h-[48px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                  value={sc.notes}
                  onChange={(e) => {
                    const notes = e.target.value;
                    qc.setQueryData(
                      ["project", projectId],
                      (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const screens = [...old.draft.screens];
                        screens[sci] = { ...screens[sci], notes };
                        return {
                          ...old,
                          draft: { ...old.draft, screens },
                        };
                      },
                    );
                  }}
                  onBlur={() => {
                    const d = qc.getQueryData(["project", projectId]) as
                      | ProjectResponse
                      | undefined;
                    if (d) saveDraft.mutate(d.draft);
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
