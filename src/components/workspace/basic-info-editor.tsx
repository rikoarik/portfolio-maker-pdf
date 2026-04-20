import type { QueryClient } from "@tanstack/react-query";
import { patchProject, type ProjectResponse } from "@/lib/api";
import { industryPlaceholder } from "@/lib/workspace-copy";
import { updateCachedProject, updateCachedProjectDraft } from "@/components/workspace/workspace-draft-helpers";

type BasicInfoEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  jobPlaceholder: string;
  persistCurrentDraft: () => void;
  onNext: () => void;
};

export function BasicInfoEditor({
  qc,
  project,
  projectId,
  jobPlaceholder,
  persistCurrentDraft,
  onNext,
}: BasicInfoEditorProps) {
  const draft = project.draft;

  return (
    <section className="space-y-5 animate-fade-in-up">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </span>
          Informasi Dasar
        </h2>
        <p className="text-xs text-zinc-500">Isi data dasar proyek dan target pekerjaan.</p>
      </div>

      <label className="block animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <span className="text-xs font-medium text-zinc-600">Judul proyek</span>
        <input
          className="input-field mt-1"
          placeholder="Mis: Aplikasi E-Commerce Mobile"
          value={project.title}
          onChange={(e) => {
            const title = e.target.value;
            updateCachedProject(qc, projectId, (project) => ({
              ...project,
              title,
            }));
          }}
          onBlur={(e) => {
            patchProject(projectId, { title: e.target.value }).catch(() => {});
          }}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Fokus pekerjaan / lamaran</span>
          <input
            className="input-field mt-1"
            placeholder={jobPlaceholder}
            value={project.jobFocus}
            onChange={(e) => {
              const jobFocus = e.target.value;
              updateCachedProject(qc, projectId, (project) => ({
                ...project,
                jobFocus,
              }));
            }}
            onBlur={(e) => {
              patchProject(projectId, { jobFocus: e.target.value }).catch(() => {});
            }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Industri / domain</span>
          <input
            className="input-field mt-1"
            placeholder={industryPlaceholder()}
            value={project.industry}
            onChange={(e) => {
              const industry = e.target.value;
              updateCachedProject(qc, projectId, (project) => ({
                ...project,
                industry,
              }));
            }}
            onBlur={(e) => {
              patchProject(projectId, { industry: e.target.value }).catch(() => {});
            }}
          />
        </label>
      </div>

      <label className="block animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <span className="text-xs font-medium text-zinc-600">Profil pembaca (untuk PDF)</span>
        <input
          className="input-field mt-1"
          placeholder="Mis. Hiring manager non-teknis"
          value={draft.roleFocus ?? ""}
          onChange={(e) => {
            const roleFocus = e.target.value;
            updateCachedProjectDraft(qc, projectId, (draft) => ({
              ...draft,
              roleFocus,
            }));
          }}
          onBlur={persistCurrentDraft}
        />
      </label>

      <div className="flex justify-end pt-2 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98]"
        >
          Lanjut ke Template
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
    </section>
  );
}
