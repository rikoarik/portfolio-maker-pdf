/**
 * Portfolio templates & onboarding personas (single source of truth).
 *
 * Use cases (all personas): UC-1 upload evidence → UC-2 AI analyze → UC-3 narrative
 * (sections) → UC-4 optional AI polish → UC-5 PDF export.
 *
 * Persona → templateId: picks default section structure + UI copy + AI context hints.
 * See PORTFOLIO_ONBOARDING_PERSONAS for the user-facing cards.
 */

export type TemplateSectionSeed = { templateKey: string; label: string };

export type TemplateDefinition = {
  id: string;
  label: string;
  /** One-line description for dropdown / onboarding */
  description: string;
  sections: TemplateSectionSeed[];
  supports: { prototypeLinks: boolean; testResults: boolean };
};

/** Stored in draft.portfolioPersona after user picks or skips onboarding */
export type PortfolioPersonaId =
  | "uiux"
  | "frontend_web"
  | "backend_api"
  | "mobile"
  | "product"
  | "engineering"
  | "skipped";

export type OnboardingPersonaCard = {
  personaId: PortfolioPersonaId;
  templateId: string;
  title: string;
  blurb: string;
  suggestedJobFocus: string;
};

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "uiux",
    label: "UI/UX case study",
    description:
      "Proses desain: konteks, riset, solusi, lesson—cocok untuk lamaran product designer.",
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
    label: "Engineering (full-stack / umum)",
    description:
      "Case study teknis generik: masalah, pendekatan, implementasi, hasil.",
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
    id: "frontend_web",
    label: "Frontend web",
    description:
      "Fokus UI web, komponen, aksesibilitas & performa—screenshot browser, Storybook, dll.",
    sections: [
      { templateKey: "overview", label: "Judul & Ringkasan" },
      { templateKey: "problem", label: "Problem / kebutuhan UI" },
      { templateKey: "implementation", label: "Implementasi & pola UI" },
      {
        templateKey: "a11y_performance",
        label: "Aksesibilitas & performa",
      },
      { templateKey: "results", label: "Results" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: false },
  },
  {
    id: "backend_api",
    label: "Backend / API",
    description:
      "API, data, arsitektur, reliabilitas—screenshot Swagger, diagram, metrik, bukan hanya mockup app.",
    sections: [
      { templateKey: "overview", label: "Judul & Ringkasan" },
      { templateKey: "problem", label: "Problem" },
      { templateKey: "architecture", label: "Arsitektur & desain sistem" },
      { templateKey: "implementation", label: "Implementation" },
      {
        templateKey: "reliability_security",
        label: "Reliabilitas, skala & keamanan",
      },
      { templateKey: "results", label: "Results" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: false },
  },
  {
    id: "mobile",
    label: "Mobile developer",
    description:
      "Fitur app, platform iOS/Android, screenshot simulator atau build nyata.",
    sections: [
      { templateKey: "overview", label: "Judul & Ringkasan" },
      { templateKey: "problem", label: "Problem" },
      { templateKey: "platform_scope", label: "Platform & ruang lingkup" },
      { templateKey: "implementation", label: "Implementation" },
      { templateKey: "results", label: "Results" },
      { templateKey: "lessons", label: "Lesson Learned" },
    ],
    supports: { prototypeLinks: true, testResults: false },
  },
  {
    id: "product",
    label: "Product / PM",
    description:
      "Konteks, insight, solusi, dampak—cocok untuk PM atau product owner.",
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

/** Cards shown in first-time onboarding (maps 1:1 to a template) */
export const PORTFOLIO_ONBOARDING_PERSONAS: OnboardingPersonaCard[] = [
  {
    personaId: "uiux",
    templateId: "uiux",
    title: "UI/UX designer",
    blurb: "Case study proses desain, riset, dan solusi visual.",
    suggestedJobFocus: "Product designer / UI UX designer",
  },
  {
    personaId: "frontend_web",
    templateId: "frontend_web",
    title: "Frontend web",
    blurb: "Implementasi UI web, komponen, demo, dan kualitas tampilan.",
    suggestedJobFocus: "Frontend engineer (React / Vue / Next.js)",
  },
  {
    personaId: "backend_api",
    templateId: "backend_api",
    title: "Backend / API",
    blurb: "Layanan API, data, arsitektur—boleh screenshot diagram atau tools.",
    suggestedJobFocus: "Backend engineer / API developer",
  },
  {
    personaId: "mobile",
    templateId: "mobile",
    title: "Mobile developer",
    blurb: "Fitur aplikasi iOS/Android dari simulator atau rilis.",
    suggestedJobFocus: "Mobile developer (iOS / Android / Flutter)",
  },
  {
    personaId: "product",
    templateId: "product",
    title: "Product / PM",
    blurb: "Keputusan produk, dampak, dan narasi untuk stakeholder.",
    suggestedJobFocus: "Product manager",
  },
  {
    personaId: "engineering",
    templateId: "engineering",
    title: "Engineering umum",
    blurb: "Full-stack atau campuran—struktur teknis serbaguna.",
    suggestedJobFocus: "Software engineer",
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

export function getOnboardingCard(
  personaId: PortfolioPersonaId,
): OnboardingPersonaCard | undefined {
  return PORTFOLIO_ONBOARDING_PERSONAS.find((p) => p.personaId === personaId);
}
