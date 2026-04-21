import { getCaseStudiesForPdf, type DraftPayload } from "@/lib/draft";

export type PortfolioCoverImage = {
  assetId: string;
  src: string;
};

export type PortfolioCoverModel = {
  title: string;
  roleFocus?: string;
  highlights: string[];
  showNarrativeBlocks: boolean;
  problemSummary: string;
  solutionSummary: string;
  impactSummary: string;
  sections: {
    id: string;
    label: string;
    content: string;
  }[];
  projectSummary: string;
  techStackText: string;
  studies: {
    id: string;
    title: string;
  }[];
  showStudies: boolean;
  images: PortfolioCoverImage[];
  moreImagesCount: number;
};

export function hasNarrativeBlocks(draft: DraftPayload): boolean {
  return !!(
    draft.problemSummary?.trim() ||
    draft.solutionSummary?.trim() ||
    draft.impactSummary?.trim()
  );
}

export function buildPortfolioCoverModel({
  title,
  draft,
  images,
}: {
  title: string;
  draft: DraftPayload;
  images: PortfolioCoverImage[];
}): PortfolioCoverModel {
  const studies = getCaseStudiesForPdf(draft);

  return {
    title: title || "Portfolio project",
    roleFocus: draft.roleFocus?.trim() || undefined,
    highlights: (draft.highlights ?? []).map((item) => item.trim()).filter(Boolean),
    showNarrativeBlocks: hasNarrativeBlocks(draft),
    problemSummary: draft.problemSummary || "—",
    solutionSummary: draft.solutionSummary || "—",
    impactSummary: draft.impactSummary || "—",
    sections: (draft.sections ?? []).map((section) => ({
      id: section.id,
      label: section.label || "Bagian",
      content: section.content || "—",
    })),
    projectSummary: draft.projectSummary || "—",
    techStackText: draft.techStack.length ? draft.techStack.join(", ") : "—",
    studies: studies.map((study) => ({
      id: study.id,
      title: study.title || "Tanpa judul",
    })),
    showStudies: studies.length > 1,
    images: images.slice(0, 6),
    moreImagesCount: Math.max(images.length - 6, 0),
  };
}
