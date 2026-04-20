import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { CaseStudiesEditor } from "@/components/workspace/case-studies-editor";
import { PrototypeLinksEditor } from "@/components/workspace/prototype-links-editor";
import { SectionsListEditor } from "@/components/workspace/sections-list-editor";
import { TestResultsEditor } from "@/components/workspace/test-results-editor";
import type { ProjectResponse } from "@/lib/api";
import type { TemplateDefinition } from "@/lib/template-sections";

type SectionsDetailEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  editorMode: "guided" | "advanced";
  selectedTemplate: TemplateDefinition | null;
  newProtoLabel: string;
  setNewProtoLabel: (value: string) => void;
  newProtoUrl: string;
  setNewProtoUrl: (value: string) => void;
  persistCurrentDraft: () => void;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
  genSectionsMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  onBack: () => void;
  onNext: () => void;
};

export function SectionsDetailEditor({
  qc,
  project,
  projectId,
  editorMode,
  selectedTemplate,
  newProtoLabel,
  setNewProtoLabel,
  newProtoUrl,
  setNewProtoUrl,
  persistCurrentDraft,
  saveDraft,
  genSectionsMut,
  onBack,
  onNext,
}: SectionsDetailEditorProps) {
  return (
    <section className="space-y-5 animate-fade-in-up">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          </span>
          Sections & Detail
        </h2>
        <p className="text-xs text-zinc-500">
          {editorMode === "guided"
            ? "Fokus ke bagian inti dulu. Aktifkan Advanced jika ingin mengisi prototype dan hasil validasi."
            : "Kelola bab portofolio, link prototype, dan studi kasus."}
        </p>
      </div>

      <SectionsListEditor
        qc={qc}
        project={project}
        projectId={projectId}
        selectedTemplate={selectedTemplate}
        persistCurrentDraft={persistCurrentDraft}
        saveDraft={saveDraft}
        genSectionsMut={genSectionsMut}
      />

      {editorMode === "advanced" && selectedTemplate?.supports.prototypeLinks ? (
        <PrototypeLinksEditor
          qc={qc}
          project={project}
          projectId={projectId}
          newProtoLabel={newProtoLabel}
          setNewProtoLabel={setNewProtoLabel}
          newProtoUrl={newProtoUrl}
          setNewProtoUrl={setNewProtoUrl}
          saveDraft={saveDraft}
        />
      ) : null}

      {editorMode === "advanced" && selectedTemplate?.supports.testResults ? (
        <TestResultsEditor
          qc={qc}
          project={project}
          projectId={projectId}
          persistCurrentDraft={persistCurrentDraft}
        />
      ) : null}

      <CaseStudiesEditor
        qc={qc}
        project={project}
        projectId={projectId}
        persistCurrentDraft={persistCurrentDraft}
        saveDraft={saveDraft}
      />

      <div className="flex items-center justify-between pt-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-[0.98]"
        >
          Perbaiki AI
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
    </section>
  );
}
