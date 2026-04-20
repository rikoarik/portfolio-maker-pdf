import type { UseMutationResult, QueryClient } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import type { DraftPayload } from "@/lib/draft";
import { listTemplates, type TemplateDefinition } from "@/lib/template-sections";
import { templateNoteForSelect } from "@/lib/workspace-copy";
import { updateCachedProjectDraft } from "@/components/workspace/workspace-draft-helpers";

const SECTION_TEMPLATES = listTemplates();

type NarrativeResponse = {
  narrative: {
    problemSummary: string;
    solutionSummary: string;
    impactSummary: string;
    warnings: string[];
  };
  draft: DraftPayload;
};

type TemplateSummaryEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  selectedTemplate: TemplateDefinition | null;
  editorMode: "guided" | "advanced";
  narrativeMode: "auto" | "manual" | "rewrite";
  setNarrativeMode: (value: "auto" | "manual" | "rewrite") => void;
  persistCurrentDraft: () => void;
  narrativeMut: UseMutationResult<
    NarrativeResponse,
    unknown,
    "auto" | "rewrite",
    unknown
  >;
  onBack: () => void;
  onNext: () => void;
};

export function TemplateSummaryEditor({
  qc,
  project,
  projectId,
  selectedTemplate,
  editorMode,
  narrativeMode,
  setNarrativeMode,
  persistCurrentDraft,
  narrativeMut,
  onBack,
  onNext,
}: TemplateSummaryEditorProps) {
  const draft = project.draft;

  return (
    <section className="space-y-5 animate-fade-in-up">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </span>
          Template & Ringkasan
        </h2>
        <p className="text-xs text-zinc-500">Pilih template dan isi ringkasan proyek.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Jenis portofolio (template)</span>
          <select
            className="input-field mt-1"
            value={draft.templateId ?? ""}
            onChange={(e) => {
              const templateId = e.target.value || undefined;
              updateCachedProjectDraft(qc, projectId, (draft) => ({
                ...draft,
                templateId,
              }));
            }}
            onBlur={persistCurrentDraft}
          >
            <option value="">(tanpa template)</option>
            {SECTION_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          <p className="font-medium text-zinc-800">Tentang template ini</p>
          <p className="mt-1">{templateNoteForSelect(selectedTemplate)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 animate-fade-in-up" style={{ animationDelay: "90ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Isi konten cepat</h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              Pilih mode: Auto dari screenshot, isi manual, atau AI rewrite.
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-white p-1 text-xs ring-1 ring-zinc-200">
            <button
              type="button"
              onClick={() => setNarrativeMode("auto")}
              className={`rounded-md px-2 py-1 font-medium ${
                narrativeMode === "auto" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setNarrativeMode("manual")}
              className={`rounded-md px-2 py-1 font-medium ${
                narrativeMode === "manual" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setNarrativeMode("rewrite")}
              className={`rounded-md px-2 py-1 font-medium ${
                narrativeMode === "rewrite" ? "bg-zinc-900 text-white" : "text-zinc-600"
              }`}
            >
              Rewrite
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={narrativeMut.isPending}
            onClick={() => narrativeMut.mutate("auto")}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {narrativeMut.isPending && narrativeMode === "auto"
              ? "Generating..."
              : "Auto dari screenshot"}
          </button>
          <button
            type="button"
            disabled={narrativeMut.isPending}
            onClick={() => narrativeMut.mutate("rewrite")}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-60"
          >
            {narrativeMut.isPending && narrativeMode === "rewrite"
              ? "Rewriting..."
              : "AI Rewrite dari input manual"}
          </button>
          {narrativeMode === "manual" ? (
            <span className="text-xs text-zinc-600">
              Mode manual aktif. Isi di bawah lalu simpan otomatis saat fokus keluar.
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "110ms" }}>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Problem</span>
          <textarea
            className="input-field mt-1 min-h-[90px] resize-y"
            placeholder="Masalah utama user yang ingin diselesaikan..."
            value={draft.problemSummary ?? ""}
            onChange={(e) => {
              const problemSummary = e.target.value;
              updateCachedProjectDraft(qc, projectId, (draft) => ({
                ...draft,
                problemSummary,
                contentMode: "manual",
              }));
            }}
            onBlur={persistCurrentDraft}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Solution</span>
          <textarea
            className="input-field mt-1 min-h-[90px] resize-y"
            placeholder="Pendekatan/fitur yang kamu kerjakan..."
            value={draft.solutionSummary ?? ""}
            onChange={(e) => {
              const solutionSummary = e.target.value;
              updateCachedProjectDraft(qc, projectId, (draft) => ({
                ...draft,
                solutionSummary,
                contentMode: "manual",
              }));
            }}
            onBlur={persistCurrentDraft}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Impact (hipotesis aman)</span>
          <textarea
            className="input-field mt-1 min-h-[90px] resize-y"
            placeholder="Dampak yang diperkirakan, hindari klaim angka pasti jika belum ada data..."
            value={draft.impactSummary ?? ""}
            onChange={(e) => {
              const impactSummary = e.target.value;
              updateCachedProjectDraft(qc, projectId, (draft) => ({
                ...draft,
                impactSummary,
                impactConfidence: "hypothesis",
                contentMode: "manual",
              }));
            }}
            onBlur={persistCurrentDraft}
          />
        </label>
      </div>

      <label className="block animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <span className="text-xs font-medium text-zinc-600">Ringkasan (boleh diedit)</span>
        <textarea
          className="input-field mt-1 min-h-[100px] resize-y"
          placeholder={
            editorMode === "guided"
              ? "Tulis masalah utama, solusi, dan dampak proyek ini untuk recruiter."
              : "Ringkasan proyek Anda…"
          }
          value={draft.projectSummary}
          onChange={(e) => {
            const projectSummary = e.target.value;
            updateCachedProjectDraft(qc, projectId, (draft) => ({
              ...draft,
              projectSummary,
            }));
          }}
          onBlur={persistCurrentDraft}
        />
      </label>

      <label className="block animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <span className="text-xs font-medium text-zinc-600">Tech stack (pisahkan koma)</span>
        <input
          className="input-field mt-1"
          placeholder="React, TypeScript, Node.js"
          value={draft.techStack.join(", ")}
          onChange={(e) => {
            const techStack = e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
            updateCachedProjectDraft(qc, projectId, (draft) => ({
              ...draft,
              techStack,
            }));
          }}
          onBlur={persistCurrentDraft}
        />
      </label>

      <label className="block animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <span className="text-xs font-medium text-zinc-600">Sorotan (satu baris = satu poin)</span>
        <textarea
          className="input-field mt-1 min-h-[72px] resize-y"
          placeholder={"Contoh:\nMeningkatkan konversi 12%\nKolaborasi lintas tim"}
          value={(draft.highlights ?? []).join("\n")}
          onChange={(e) => {
            const highlights = e.target.value
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);
            updateCachedProjectDraft(qc, projectId, (draft) => ({
              ...draft,
              highlights: highlights.length ? highlights : undefined,
            }));
          }}
          onBlur={persistCurrentDraft}
        />
      </label>

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
          Lanjut ke Sections
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
    </section>
  );
}
