import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { AiRefinementPanel } from "@/components/workspace/ai-refinement-panel";
import { BasicInfoEditor } from "@/components/workspace/basic-info-editor";
import { SectionsDetailEditor } from "@/components/workspace/sections-detail-editor";
import { TemplateSummaryEditor } from "@/components/workspace/template-summary-editor";
import type { ProjectResponse } from "@/lib/api";
import type { DraftPayload } from "@/lib/draft";
import type { TemplateDefinition } from "@/lib/template-sections";
import { persistCachedProjectDraft } from "@/components/workspace/workspace-draft-helpers";

type NarrativeResponse = {
  narrative: {
    problemSummary: string;
    solutionSummary: string;
    impactSummary: string;
    warnings: string[];
  };
  draft: DraftPayload;
};

type ContentChecklist = {
  uploaded: boolean;
  analyzed: boolean;
  drafted: boolean;
  exportReady: boolean;
};

type ContentStepProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  contentStep: number;
  setContentStep: (value: number) => void;
  editorMode: "guided" | "advanced";
  setEditorMode: (value: "guided" | "advanced") => void;
  narrativeMode: "auto" | "manual" | "rewrite";
  setNarrativeMode: (value: "auto" | "manual" | "rewrite") => void;
  regenInstr: string;
  setRegenInstr: (value: string) => void;
  newProtoLabel: string;
  setNewProtoLabel: (value: string) => void;
  newProtoUrl: string;
  setNewProtoUrl: (value: string) => void;
  jobPlaceholder: string;
  selectedTemplate: TemplateDefinition | null;
  checklist: ContentChecklist;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
  narrativeMut: UseMutationResult<
    NarrativeResponse,
    unknown,
    "auto" | "rewrite",
    unknown
  >;
  genSectionsMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  regenMut: UseMutationResult<ProjectResponse, unknown, void, unknown>;
  retryMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  onGoToStep: (value: number) => void;
};

export function ContentStep({
  qc,
  project,
  projectId,
  contentStep,
  setContentStep,
  editorMode,
  setEditorMode,
  narrativeMode,
  setNarrativeMode,
  regenInstr,
  setRegenInstr,
  newProtoLabel,
  setNewProtoLabel,
  newProtoUrl,
  setNewProtoUrl,
  jobPlaceholder,
  selectedTemplate,
  checklist,
  saveDraft,
  narrativeMut,
  genSectionsMut,
  regenMut,
  retryMut,
  onGoToStep,
}: ContentStepProps) {
  const persistCurrentDraft = () => {
    persistCachedProjectDraft(qc, projectId, saveDraft);
  };

  return (
    <>
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
        {[
          { label: "Informasi Dasar", icon: "📝" },
          { label: "Template & Ringkasan", icon: "📋" },
          { label: "Sections & Detail", icon: "🧩" },
          { label: "Perbaiki AI", icon: "✨" },
        ].map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setContentStep(index)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all sm:text-xs ${
              index === contentStep
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:bg-white/50 hover:text-zinc-700"
            }`}
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
        <p className="text-xs text-zinc-500">
          {editorMode === "guided"
            ? "Mode Guided: tampilkan input penting dulu agar cepat jadi."
            : "Mode Advanced: tampilkan semua detail termasuk prototype dan validasi."}
        </p>
        <div className="inline-flex rounded-lg bg-zinc-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setEditorMode("guided")}
            className={`rounded-md px-2 py-1 font-medium ${
              editorMode === "guided"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Guided
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("advanced")}
            className={`rounded-md px-2 py-1 font-medium ${
              editorMode === "advanced"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500"
            }`}
          >
            Advanced
          </button>
        </div>
      </div>

      {editorMode === "guided" ? (
        <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
          <p className="text-xs font-medium text-indigo-800">
            Jalur tercepat ke PDF (kurang dari 5 menit)
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onGoToStep(0)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                checklist.uploaded
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              1. Upload screenshot {checklist.uploaded ? "✓" : ""}
            </button>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                checklist.analyzed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              2. Jalankan analisis AI {checklist.analyzed ? "✓" : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                onGoToStep(2);
                setContentStep(1);
              }}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                checklist.drafted
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              3. Rapikan ringkasan cepat {checklist.drafted ? "✓" : ""}
            </button>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className={`rounded-lg border px-3 py-2 text-left text-xs ${
                checklist.exportReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              4. Export PDF {checklist.exportReady ? "✓" : ""}
            </button>
          </div>
        </div>
      ) : null}

      {contentStep === 0 ? (
        <BasicInfoEditor
          qc={qc}
          project={project}
          projectId={projectId}
          jobPlaceholder={jobPlaceholder}
          persistCurrentDraft={persistCurrentDraft}
          onNext={() => setContentStep(1)}
        />
      ) : null}

      {contentStep === 1 ? (
        <TemplateSummaryEditor
          qc={qc}
          project={project}
          projectId={projectId}
          selectedTemplate={selectedTemplate}
          editorMode={editorMode}
          narrativeMode={narrativeMode}
          setNarrativeMode={setNarrativeMode}
          persistCurrentDraft={persistCurrentDraft}
          narrativeMut={narrativeMut}
          onBack={() => setContentStep(0)}
          onNext={() => setContentStep(2)}
        />
      ) : null}

      {contentStep === 2 ? (
        <SectionsDetailEditor
          qc={qc}
          project={project}
          projectId={projectId}
          editorMode={editorMode}
          selectedTemplate={selectedTemplate}
          newProtoLabel={newProtoLabel}
          setNewProtoLabel={setNewProtoLabel}
          newProtoUrl={newProtoUrl}
          setNewProtoUrl={setNewProtoUrl}
          persistCurrentDraft={persistCurrentDraft}
          saveDraft={saveDraft}
          genSectionsMut={genSectionsMut}
          onBack={() => setContentStep(1)}
          onNext={() => setContentStep(3)}
        />
      ) : null}

      {contentStep === 3 ? (
        <AiRefinementPanel
          qc={qc}
          project={project}
          projectId={projectId}
          regenInstr={regenInstr}
          setRegenInstr={setRegenInstr}
          regenMut={regenMut}
          saveDraft={saveDraft}
          retryMut={retryMut}
          onBack={() => setContentStep(2)}
          onNext={() => onGoToStep(3)}
        />
      ) : null}
    </>
  );
}
