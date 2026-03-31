export type TemplateSectionSeed = { templateKey: string; label: string };

export type TemplateDefinition = {
  id: string;
  label: string;
  sections: TemplateSectionSeed[];
  supports: { prototypeLinks: boolean; testResults: boolean };
};

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "uiux",
    label: "UI/UX case study",
    sections: [
      { templateKey: "title_desc", label: "Judul & Deskripsi singkat" },
      { templateKey: "context", label: "Keterangan" },
      { templateKey: "research_findings", label: "Research Finding" },
      { templateKey: "solution", label: "Solution" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: true },
  },
  {
    id: "engineering",
    label: "Engineering case study",
    sections: [
      { templateKey: "overview", label: "Judul & Ringkasan" },
      { templateKey: "problem", label: "Problem" },
      { templateKey: "approach", label: "Approach" },
      { templateKey: "implementation", label: "Implementation" },
      { templateKey: "results", label: "Results" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: false },
  },
  {
    id: "product",
    label: "Product/PM case study",
    sections: [
      { templateKey: "overview", label: "Judul & Ringkasan" },
      { templateKey: "context", label: "Context" },
      { templateKey: "insights", label: "Insights" },
      { templateKey: "solution", label: "Solution" },
      { templateKey: "impact", label: "Impact" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: true },
  },
];

export function listTemplates(): TemplateDefinition[] {
  return TEMPLATES;
}

export function generateTemplateSections(
  templateId: string,
): TemplateDefinition | null {
  return TEMPLATES.find((t) => t.id === templateId) ?? null;
}

