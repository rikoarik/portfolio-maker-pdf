import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import type { TemplateDefinition } from "@/lib/template-sections";
import {
  updateCachedProjectDraft,
  updateCachedProjectDraftAndSave,
} from "@/components/workspace/workspace-draft-helpers";

type SectionsListEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  selectedTemplate: TemplateDefinition | null;
  persistCurrentDraft: () => void;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
  genSectionsMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
};

export function SectionsListEditor({
  qc,
  project,
  projectId,
  selectedTemplate,
  persistCurrentDraft,
  saveDraft,
  genSectionsMut,
}: SectionsListEditorProps) {
  const draft = project.draft;

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 animate-fade-in-up"
      style={{ animationDelay: "60ms" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-800">Sections (fleksibel)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200"
            onClick={() => {
              updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                const seed = selectedTemplate?.sections ?? [];
                const hasAny = (draft.sections ?? []).length > 0;
                if (!hasAny && seed.length > 0) {
                  return {
                    ...draft,
                    sections: seed.map((section) => ({
                      id: `sec_${Math.random().toString(36).slice(2, 10)}`,
                      label: section.label,
                      content: "",
                      templateKey: section.templateKey,
                    })),
                  };
                }

                return {
                  ...draft,
                  sections: [
                    ...(draft.sections ?? []),
                    {
                      id: `sec_${Math.random().toString(36).slice(2, 10)}`,
                      label: "",
                      content: "",
                    },
                  ],
                };
              });
            }}
          >
            {(draft.sections ?? []).length === 0 && selectedTemplate
              ? "Buat kerangka dari template"
              : "+ Section"}
          </button>
          {selectedTemplate ? (
            <button
              type="button"
              className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              disabled={genSectionsMut.isPending || !project.jobFocus.trim()}
              onClick={() => genSectionsMut.mutate(selectedTemplate.id)}
              title={
                !project.jobFocus.trim()
                  ? "Isi fokus pekerjaan/role terlebih dahulu"
                  : "Isi section dengan AI"
              }
            >
              {genSectionsMut.isPending ? "Generating…" : "Isi section dengan AI"}
            </button>
          ) : null}
        </div>
      </div>
      {(draft.sections ?? []).length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          Pilih template lalu klik &quot;Buat kerangka dari template&quot;, atau tambah section manual.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {(draft.sections ?? []).map((section, sectionIndex) => (
            <li key={section.id} className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs text-zinc-500">Judul section</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-40"
                    disabled={sectionIndex === 0}
                    onClick={() => {
                      updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                        const sections = [...(draft.sections ?? [])];
                        const temp = sections[sectionIndex - 1];
                        sections[sectionIndex - 1] = sections[sectionIndex];
                        sections[sectionIndex] = temp;
                        return {
                          ...draft,
                          sections,
                        };
                      });
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-40"
                    disabled={sectionIndex === (draft.sections?.length ?? 0) - 1}
                    onClick={() => {
                      updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                        const sections = [...(draft.sections ?? [])];
                        const temp = sections[sectionIndex + 1];
                        sections[sectionIndex + 1] = sections[sectionIndex];
                        sections[sectionIndex] = temp;
                        return {
                          ...draft,
                          sections,
                        };
                      });
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200"
                    onClick={() => {
                      updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                        const sections = (draft.sections ?? []).filter(
                          (item) => item.id !== section.id,
                        );
                        return {
                          ...draft,
                          sections: sections.length ? sections : undefined,
                        };
                      });
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <input
                className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                value={section.label}
                onChange={(e) => {
                  const label = e.target.value;
                  updateCachedProjectDraft(qc, projectId, (draft) => {
                    const sections = [...(draft.sections ?? [])];
                    sections[sectionIndex] = { ...sections[sectionIndex], label };
                    return {
                      ...draft,
                      sections,
                    };
                  });
                }}
                onBlur={persistCurrentDraft}
              />
              <label className="mt-2 block text-xs text-zinc-500">Isi</label>
              <textarea
                className="mt-1 min-h-[56px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                value={section.content}
                onChange={(e) => {
                  const content = e.target.value;
                  updateCachedProjectDraft(qc, projectId, (draft) => {
                    const sections = [...(draft.sections ?? [])];
                    sections[sectionIndex] = { ...sections[sectionIndex], content };
                    return {
                      ...draft,
                      sections,
                    };
                  });
                }}
                onBlur={persistCurrentDraft}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
