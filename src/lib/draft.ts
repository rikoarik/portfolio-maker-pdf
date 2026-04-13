export type ScreenDraft = {
  assetId: string;
  title: string;
  bullets: string[];
  notes: string;
};

export type CaseStudyDraft = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  screenAssetIds: string[];
};

export type PrototypeLink = { label: string; url: string };

export type DraftSection = {
  /** Stable id for UI rendering & reordering */
  id: string;
  label: string;
  content: string;
  /** Optional identifier for template-based sections (role-based templates). */
  templateKey?: string;
};

export type DraftPayload = {
  draftVersion: number;
  projectSummary: string;
  problemSummary?: string;
  solutionSummary?: string;
  impactSummary?: string;
  contentMode?: "manual" | "auto" | "rewrite";
  impactConfidence?: "hypothesis" | "data_backed";
  techStack: string[];
  screens: ScreenDraft[];
  roleFocus?: string;
  highlights?: string[];
  sections?: DraftSection[];
  /** Selected template id (role-based), used to seed/generate sections. */
  templateId?: string;
  /** Onboarding persona (uiux, frontend_web, …) or "skipped"; drives copy & AI context. */
  portfolioPersona?: string;
  /** Optional labeled prototype links (Figma, Framer, etc.) */
  prototypeLinks?: PrototypeLink[];
  /** Optional freeform test results / design validation notes */
  testResults?: string;
  studies?: CaseStudyDraft[];
};

function newCaseStudyId(): string {
  return `cs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function newSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyCaseStudy(screenAssetIds: string[]): CaseStudyDraft {
  return {
    id: newCaseStudyId(),
    title: "Studi kasus baru",
    summary: "",
    tags: [],
    screenAssetIds: [...screenAssetIds],
  };
}

export const emptyDraft = (): DraftPayload => ({
  draftVersion: 3,
  projectSummary: "",
  contentMode: "manual",
  impactConfidence: "hypothesis",
  techStack: [],
  screens: [],
  studies: [],
});

/** Store in Prisma Json / PostgreSQL jsonb */
export function draftToPrismaJson(d: DraftPayload): object {
  return JSON.parse(JSON.stringify(d)) as object;
}

function parseCaseStudy(raw: unknown): CaseStudyDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;
  return {
    id: String(s.id ?? newCaseStudyId()),
    title: String(s.title ?? ""),
    summary: String(s.summary ?? ""),
    tags: Array.isArray(s.tags) ? s.tags.map((t) => String(t)) : [],
    screenAssetIds: Array.isArray(s.screenAssetIds)
      ? s.screenAssetIds.map((x) => String(x))
      : [],
  };
}

/** Accept DB Json, string, or object */
export function parseDraft(raw: unknown): DraftPayload {
  if (raw == null) return emptyDraft();
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return emptyDraft();
    }
  }
  if (typeof data !== "object" || data === null) return emptyDraft();
  const j = data as Record<string, unknown>;

  const screens = Array.isArray(j.screens)
    ? j.screens.map((s) => {
        const x = s as ScreenDraft;
        return {
          assetId: String(x?.assetId ?? ""),
          title: String(x?.title ?? ""),
          bullets: Array.isArray(x?.bullets)
            ? x.bullets.map((b) => String(b))
            : [],
          notes: String(x?.notes ?? ""),
        };
      })
    : [];

  let studies: CaseStudyDraft[] | undefined;
  if (Array.isArray(j.studies)) {
    studies = j.studies
      .map(parseCaseStudy)
      .filter((x): x is CaseStudyDraft => x != null);
  }

  const sections = Array.isArray(j.sections)
    ? j.sections
        .map((sec) => {
          if (typeof sec !== "object" || sec === null) return null;
          const x = sec as Record<string, unknown>;
          const templateKey =
            typeof x.templateKey === "string" ? x.templateKey : undefined;
          return {
            id: typeof x.id === "string" && x.id ? x.id : newSectionId(),
            label: String(x.label ?? ""),
            content: String(x.content ?? ""),
            ...(templateKey ? { templateKey } : {}),
          } as DraftSection;
        })
        .filter((x): x is DraftSection => x !== null)
    : undefined;

  const prototypeLinks = Array.isArray(j.prototypeLinks)
    ? j.prototypeLinks
        .map((raw) => {
          if (typeof raw !== "object" || raw === null) return null;
          const x = raw as Record<string, unknown>;
          return {
            label: String(x.label ?? ""),
            url: String(x.url ?? ""),
          } satisfies PrototypeLink;
        })
        .filter((x): x is PrototypeLink => x != null)
    : undefined;

  const highlights = Array.isArray(j.highlights)
    ? j.highlights.map((h) => String(h))
    : undefined;

  return {
    draftVersion: typeof j.draftVersion === "number" ? j.draftVersion : 3,
    projectSummary: String(j.projectSummary ?? ""),
    problemSummary:
      typeof j.problemSummary === "string" ? j.problemSummary : undefined,
    solutionSummary:
      typeof j.solutionSummary === "string" ? j.solutionSummary : undefined,
    impactSummary:
      typeof j.impactSummary === "string" ? j.impactSummary : undefined,
    contentMode:
      j.contentMode === "manual" ||
      j.contentMode === "auto" ||
      j.contentMode === "rewrite"
        ? j.contentMode
        : "manual",
    impactConfidence:
      j.impactConfidence === "data_backed" ? "data_backed" : "hypothesis",
    techStack: Array.isArray(j.techStack)
      ? j.techStack.map((t) => String(t))
      : [],
    screens,
    roleFocus:
      typeof j.roleFocus === "string" ? j.roleFocus : undefined,
    highlights,
    sections,
    templateId:
      typeof j.templateId === "string" ? j.templateId : undefined,
    portfolioPersona:
      typeof j.portfolioPersona === "string"
        ? j.portfolioPersona
        : undefined,
    prototypeLinks,
    testResults:
      typeof j.testResults === "string" ? j.testResults : undefined,
    studies,
  };
}

/** Case studies for PDF: explicit studies or one synthetic chapter from legacy draft. */
export function getCaseStudiesForPdf(draft: DraftPayload): CaseStudyDraft[] {
  if (draft.studies && draft.studies.length > 0) {
    return draft.studies.map((s) => ({
      ...s,
      id: s.id || newCaseStudyId(),
    }));
  }
  const allIds = draft.screens.map((x) => x.assetId).filter(Boolean);
  return [
    {
      id: "default",
      title: draft.projectSummary ? "Ringkasan proyek" : "Portofolio",
      summary: draft.projectSummary,
      tags: draft.techStack,
      screenAssetIds: allIds,
    },
  ];
}
