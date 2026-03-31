import type {
  PortfolioProject,
  ScreenshotAsset,
  AnalysisResult,
} from "@/generated/prisma/client";
import { parseDraft, type DraftPayload } from "@/lib/draft";

type ProjectWithShots = PortfolioProject & {
  screenshots: (ScreenshotAsset & {
    analysisResults: AnalysisResult[];
  })[];
};

export function serializeProject(
  project: ProjectWithShots,
  baseUrl: string,
): {
  id: string;
  title: string;
  locale: string;
  jobFocus: string;
  industry: string;
  status: string;
  draft: DraftPayload;
  updatedAt: string;
  screenshots: {
    id: string;
    sortOrder: number;
    mime: string;
    analysisStatus: string;
    previewUrl: string;
    lastAnalysis: null | {
      summaryText: string;
      rawJson: Record<string, unknown>;
      errorCode: string | null;
    };
  }[];
} {
  const draft = parseDraft(project.draftPayload);
  const origin = baseUrl.replace(/\/$/, "");
  return {
    id: project.id,
    title: project.title,
    locale: project.locale,
    jobFocus: project.jobFocus ?? "",
    industry: project.industry ?? "",
    status: project.status,
    draft,
    updatedAt: project.updatedAt.toISOString(),
    screenshots: project.screenshots.map((s) => {
      const last = s.analysisResults[0];
      let rawJson: Record<string, unknown> = {};
      if (last?.rawJson != null) {
        if (typeof last.rawJson === "object" && !Array.isArray(last.rawJson)) {
          rawJson = last.rawJson as Record<string, unknown>;
        } else if (typeof last.rawJson === "string") {
          try {
            rawJson = JSON.parse(last.rawJson) as Record<string, unknown>;
          } catch {
            rawJson = {};
          }
        }
      }
      return {
        id: s.id,
        sortOrder: s.sortOrder,
        mime: s.mime,
        analysisStatus: s.analysisStatus,
        previewUrl: `${origin}/api/v1/projects/${project.id}/screenshots/${s.id}/file`,
        lastAnalysis: last
          ? {
              summaryText: last.summaryText,
              rawJson,
              errorCode: last.errorCode,
            }
          : null,
      };
    }),
  };
}
