import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";
import { updateCachedProjectDraftAndSave } from "@/components/workspace/workspace-draft-helpers";

type PrototypeLinksEditorProps = {
  qc: QueryClient;
  project: ProjectResponse;
  projectId: string;
  newProtoLabel: string;
  setNewProtoLabel: (value: string) => void;
  newProtoUrl: string;
  setNewProtoUrl: (value: string) => void;
  saveDraft: UseMutationResult<
    ProjectResponse,
    unknown,
    ProjectResponse["draft"],
    unknown
  >;
};

export function PrototypeLinksEditor({
  qc,
  project,
  projectId,
  newProtoLabel,
  setNewProtoLabel,
  newProtoUrl,
  setNewProtoUrl,
  saveDraft,
}: PrototypeLinksEditorProps) {
  const draft = project.draft;

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 animate-fade-in-up"
      style={{ animationDelay: "120ms" }}
    >
      <h3 className="text-sm font-medium text-zinc-800">Link prototype</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
          placeholder="Label (mis. Figma, demo live)"
          value={newProtoLabel}
          onChange={(e) => setNewProtoLabel(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
          placeholder="https://..."
          value={newProtoUrl}
          onChange={(e) => setNewProtoUrl(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!newProtoLabel.trim() || !newProtoUrl.trim()}
          onClick={() => {
            updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => ({
              ...draft,
              prototypeLinks: [
                ...(draft.prototypeLinks ?? []),
                { label: newProtoLabel.trim(), url: newProtoUrl.trim() },
              ],
            }));
            setNewProtoLabel("");
            setNewProtoUrl("");
          }}
        >
          Tambah
        </button>
      </div>

      {(draft.prototypeLinks ?? []).length > 0 ? (
        <ul className="mt-3 space-y-2">
          {(draft.prototypeLinks ?? []).map((link, index) => (
            <li
              key={`${link.url}-${index}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">{link.label}</p>
                <p className="truncate font-mono text-xs text-zinc-600">{link.url}</p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-red-700 underline"
                onClick={() => {
                  updateCachedProjectDraftAndSave(qc, projectId, saveDraft, (draft) => {
                    const prototypeLinks = (draft.prototypeLinks ?? []).filter(
                      (_, itemIndex) => itemIndex !== index,
                    );
                    return {
                      ...draft,
                      prototypeLinks: prototypeLinks.length ? prototypeLinks : undefined,
                    };
                  });
                }}
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Opsional: Figma, Storybook, atau demo.</p>
      )}
    </div>
  );
}
