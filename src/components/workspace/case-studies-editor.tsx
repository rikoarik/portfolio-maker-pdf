import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import { createEmptyCaseStudy } from "@/lib/draft";
import {
  updateCachedProjectDraft,
  updateCachedProjectDraftAndSave,
} from "@/components/workspace/workspace-draft-helpers";

type CaseStudiesEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  persistCurrentDraft: () => void;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
};

export function CaseStudiesEditor({
  qc,
  project,
  projectId,
  persistCurrentDraft,
  saveDraft,
}: CaseStudiesEditorProps) {
  const draft = project.draft;

  return (
    <details
      id="ws-studies"
      className="scroll-mt-24 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 animate-fade-in-up"
      style={{ animationDelay: "240ms" }}
      open={(draft.studies ?? []).length > 0}
    >
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        Studi kasus di PDF (banyak bab) — opsional
      </summary>
      <div className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            Satu bab default dipakai dari ringkasan utama jika kosong.
          </p>
          <button
            type="button"
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200"
            onClick={() => {
              updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft, currentProject) => {
                const ids = currentProject.screenshots.map((screenshot) => screenshot.id);
                const next = createEmptyCaseStudy(ids);
                return {
                  ...draft,
                  studies: [...(draft.studies ?? []), next],
                };
              });
            }}
          >
            + Tambah studi kasus
          </button>
        </div>
        {(draft.studies ?? []).map((study, studyIndex) => (
          <div
            key={study.id}
            className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700">Bab {studyIndex + 1}</span>
              <button
                type="button"
                className="text-xs font-medium text-red-700 underline"
                onClick={() => {
                  updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                    const studies = (draft.studies ?? []).filter(
                      (_, index) => index !== studyIndex,
                    );
                    return {
                      ...draft,
                      studies: studies.length ? studies : undefined,
                    };
                  });
                }}
              >
                Hapus
              </button>
            </div>
            <input
              className="w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
              placeholder="Judul studi kasus"
              value={study.title}
              onChange={(e) => {
                const title = e.target.value;
                updateCachedProjectDraft(qc, projectId, (draft) => {
                  const studies = [...(draft.studies ?? [])];
                  studies[studyIndex] = { ...studies[studyIndex], title };
                  return {
                    ...draft,
                    studies,
                  };
                });
              }}
              onBlur={persistCurrentDraft}
            />
            <textarea
              className="min-h-[60px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
              placeholder="Deskripsi studi kasus…"
              value={study.summary}
              onChange={(e) => {
                const summary = e.target.value;
                updateCachedProjectDraft(qc, projectId, (draft) => {
                  const studies = [...(draft.studies ?? [])];
                  studies[studyIndex] = { ...studies[studyIndex], summary };
                  return {
                    ...draft,
                    studies,
                  };
                });
              }}
              onBlur={persistCurrentDraft}
            />
          </div>
        ))}
      </div>
    </details>
  );
}
