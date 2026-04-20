import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { ScreenDraftsEditor } from "@/components/workspace/screen-drafts-editor";
import type { ProjectResponse } from "@/lib/api";

type AiRefinementPanelProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  regenInstr: string;
  setRegenInstr: (value: string) => void;
  regenMut: UseMutationResult<ProjectResponse, unknown, void, unknown>;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
  retryMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  onBack: () => void;
  onNext: () => void;
};

export function AiRefinementPanel({
  qc,
  project,
  projectId,
  regenInstr,
  setRegenInstr,
  regenMut,
  saveDraft,
  retryMut,
  onBack,
  onNext,
}: AiRefinementPanelProps) {
  return (
    <section className="space-y-5 animate-fade-in-up">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
          </span>
          Perbaiki dengan AI
        </h2>
        <p className="text-xs text-zinc-500">Instruksikan AI untuk meningkatkan teks dan edit per layar.</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <h3 className="text-sm font-semibold text-zinc-800">Perbaiki teks dengan AI</h3>
        <p className="mb-3 mt-1 text-xs text-zinc-500">Instruksi singkat (mis. &quot;persingkat&quot;, &quot;nada formal&quot;).</p>
        <textarea
          className="input-field min-h-[72px] resize-y"
          value={regenInstr}
          onChange={(e) => setRegenInstr(e.target.value)}
          placeholder="Instruksi untuk mengedit ringkasan dan poin per layar…"
        />
        <button
          type="button"
          disabled={regenMut.isPending || !regenInstr.trim()}
          onClick={() => regenMut.mutate()}
          className="btn-primary mt-3 !rounded-xl !text-sm"
        >
          {regenMut.isPending ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Memproses…</>
          ) : "✨ Regenerate teks"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <h3 className="text-sm font-semibold text-zinc-800">Per layar</h3>
        <p className="mt-1 text-xs text-zinc-500">Edit langsung atau pakai Regenerate di atas.</p>
        <ScreenDraftsEditor
          qc={qc}
          projectId={projectId}
          project={project}
          saveDraft={saveDraft}
          retryMut={retryMut}
        />
      </div>

      <div className="flex items-center justify-between pt-2 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
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
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98]"
        >
          Lanjut ke Export
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
    </section>
  );
}
