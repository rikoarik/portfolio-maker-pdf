import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";

type SaveDraftMutation = UseMutationResult<
  ProjectResponse,
  unknown,
  ProjectResponse["draft"],
  unknown
>;

type ProjectDraft = ProjectResponse["draft"];

export function updateCachedProject(
  qc: QueryClient,
  projectId: string,
  updater: (project: ProjectResponse) => ProjectResponse,
) {
  qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) =>
    old ? updater(old) : old,
  );
}

export function updateCachedProjectDraft(
  qc: QueryClient,
  projectId: string,
  updater: (draft: ProjectDraft, project: ProjectResponse) => ProjectDraft,
) {
  updateCachedProject(qc, projectId, (project) => ({
    ...project,
    draft: updater(project.draft, project),
  }));
}

export function updateCachedProjectDraftAndSave(
  qc: QueryClient,
  projectId: string,
  saveDraft: SaveDraftMutation,
  updater: (draft: ProjectDraft, project: ProjectResponse) => ProjectDraft,
) {
  let nextDraft: ProjectDraft | undefined;

  updateCachedProject(qc, projectId, (project) => {
    nextDraft = updater(project.draft, project);
    return {
      ...project,
      draft: nextDraft,
    };
  });

  if (nextDraft) saveDraft.mutate(nextDraft);
}

export function persistCachedProjectDraft(
  qc: QueryClient,
  projectId: string,
  saveDraft: SaveDraftMutation,
) {
  const project = qc.getQueryData(["project", projectId]) as ProjectResponse | undefined;
  if (project) saveDraft.mutate(project.draft);
}
