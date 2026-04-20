"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import type { UseMutationResult } from "@tanstack/react-query";
import {
  persistCachedProjectDraft,
  updateCachedProjectDraft,
} from "@/components/workspace/workspace-draft-helpers";

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
    <div className="mt-4 space-y-4">
      {draft.screens.map((sc, sci) => {
        const shot = project.screenshots.find((x) => x.id === sc.assetId);
        const si = project.screenshots.findIndex((x) => x.id === sc.assetId);
        return (
          <div
            key={sc.assetId}
            className="group rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start gap-4">
              {shot ? (
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.previewUrl}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                  {/* Number badge */}
                  <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-zinc-900/70 text-[10px] font-bold text-white backdrop-blur-sm">
                    {si >= 0 ? si + 1 : "?"}
                  </div>
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {si >= 0 ? `Layar ${si + 1}` : "Layar"}
                  </span>
                  {shot?.analysisStatus === "failed" ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                        Gagal dianalisis
                      </span>
                      <button
                        type="button"
                        disabled={retryMut.isPending}
                        onClick={() => retryMut.mutate(shot.id)}
                        className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                        Coba lagi
                      </button>
                    </div>
                  ) : null}
                </div>
                {shot?.analysisStatus === "failed" && shot.lastAnalysis?.errorCode ? (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Detail gagal: {shot.lastAnalysis.errorCode}
                  </p>
                ) : null}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Judul</label>
                  <input
                    className="input-field !py-2 !text-sm"
                    value={sc.title}
                    placeholder="Judul layar..."
                    onChange={(e) => {
                      const title = e.target.value;
                      updateCachedProjectDraft(qc, projectId, (draft) => {
                        const screens = [...draft.screens];
                        screens[sci] = { ...screens[sci], title };
                        return {
                          ...draft,
                          screens,
                        };
                      });
                    }}
                    onBlur={() => {
                      persistCachedProjectDraft(qc, projectId, saveDraft);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Poin (satu baris = satu bullet)
                  </label>
                  <textarea
                    className="input-field !py-2 !text-sm min-h-[72px] resize-y"
                    value={sc.bullets.join("\n")}
                    placeholder="Satu poin per baris..."
                    onChange={(e) => {
                      const bullets = e.target.value
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      updateCachedProjectDraft(qc, projectId, (draft) => {
                        const screens = [...draft.screens];
                        screens[sci] = { ...screens[sci], bullets };
                        return {
                          ...draft,
                          screens,
                        };
                      });
                    }}
                    onBlur={() => {
                      persistCachedProjectDraft(qc, projectId, saveDraft);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Catatan
                  </label>
                  <textarea
                    className="input-field !py-2 !text-sm min-h-[48px] resize-y"
                    value={sc.notes}
                    placeholder="Catatan tambahan..."
                    onChange={(e) => {
                      const notes = e.target.value;
                      updateCachedProjectDraft(qc, projectId, (draft) => {
                        const screens = [...draft.screens];
                        screens[sci] = { ...screens[sci], notes };
                        return {
                          ...draft,
                          screens,
                        };
                      });
                    }}
                    onBlur={() => {
                      persistCachedProjectDraft(qc, projectId, saveDraft);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
