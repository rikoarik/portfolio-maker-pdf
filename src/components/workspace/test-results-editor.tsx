import type { QueryClient } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import { updateCachedProjectDraft } from "@/components/workspace/workspace-draft-helpers";

type TestResultsEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  persistCurrentDraft: () => void;
};

export function TestResultsEditor({
  qc,
  project,
  projectId,
  persistCurrentDraft,
}: TestResultsEditorProps) {
  const draft = project.draft;

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 animate-fade-in-up"
      style={{ animationDelay: "180ms" }}
    >
      <h3 className="text-sm font-medium text-zinc-800">Hasil test / validasi</h3>
      <textarea
        className="mt-3 min-h-[96px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
        placeholder="Ringkasan hasil test: temuan utama, evidence, keputusan desain..."
        value={draft.testResults ?? ""}
        onChange={(e) => {
          const testResults = e.target.value;
          updateCachedProjectDraft(qc, projectId, (draft) => ({
            ...draft,
            testResults,
          }));
        }}
        onBlur={persistCurrentDraft}
      />
    </div>
  );
}
