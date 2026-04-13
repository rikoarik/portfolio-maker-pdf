import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_GEMINI_MODEL } from "@/lib/constants";
import type {
  DraftSection,
  PrototypeLink,
} from "@/lib/draft";
import type { TemplateDefinition } from "@/lib/template-sections";

function getClient(apiKey?: string): GoogleGenerativeAI {
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(key);
}

function modelName(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

function stripJsonFence(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return t;
}

function newSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateSectionsWithAi(args: {
  locale: string;
  jobFocus: string;
  industry: string;
  title: string;
  projectSummary: string;
  template: TemplateDefinition;
  existing: DraftSection[];
  portfolioPersona?: string;
  apiKey?: string;
}): Promise<{
  sections: DraftSection[];
  prototypeLinks?: PrototypeLink[];
  testResults?: string;
}> {
  const gen = getClient(args.apiKey);
  const model = gen.getGenerativeModel({ model: modelName() });

  const lang = args.locale === "id" ? "Indonesian" : "English";
  const supports = args.template.supports;
  const personaLine = args.portfolioPersona?.trim()
    ? `Portfolio persona: ${args.portfolioPersona.trim()} (align vocabulary and examples with this role).`
    : "";
  const prompt = `You write portfolio case-study sections for job applications.
Job focus/role: ${args.jobFocus}
Industry/domain: ${args.industry || "general"}
Project title: ${args.title || "Untitled"}
Project summary (may be empty): ${args.projectSummary || ""}
Template kind: ${args.template.label} — ${args.template.description}
${personaLine}

Template sections (keep this order):
${args.template.sections.map((s) => `- ${s.templateKey}: ${s.label}`).join("\n")}

Existing sections (may be empty; you may reuse content if relevant):
${JSON.stringify(args.existing)}

Return ONLY valid JSON (no markdown) with this shape:
{
  "sections":[{"templateKey":"string","label":"string","content":"string"}],
  ${supports.prototypeLinks ? `"prototypeLinks":[{"label":"string","url":"https://..."}],` : ""}
  ${supports.testResults ? `"testResults":"string"` : ""}
}

Rules:
- Language for all text fields: ${lang}.
- content: concise but substantive (3-8 lines each). Use bullets where appropriate.
- Do not invent metrics; if you mention impact, keep it qualitative unless provided.
- prototypeLinks: include only if provided/known; if unsure, return empty array.
- testResults: optional; if unsure, return empty string.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = stripJsonFence(text);
  const j = JSON.parse(raw) as Record<string, unknown>;

  const sectionsRaw = Array.isArray(j.sections) ? j.sections : [];
  const sections: DraftSection[] = sectionsRaw.map((s) => {
    const x = s as Record<string, unknown>;
    const templateKey = String(x.templateKey ?? "").trim();
    return {
      id: newSectionId(),
      label: String(x.label ?? ""),
      content: String(x.content ?? ""),
      ...(templateKey ? { templateKey } : {}),
    };
  });

  const prototypeLinksRaw = Array.isArray(j.prototypeLinks)
    ? j.prototypeLinks
    : undefined;
  const prototypeLinks = prototypeLinksRaw
    ? prototypeLinksRaw
        .map((p) => {
          if (typeof p !== "object" || p === null) return null;
          const x = p as Record<string, unknown>;
          return {
            label: String(x.label ?? ""),
            url: String(x.url ?? ""),
          } as PrototypeLink;
        })
        .filter((x): x is PrototypeLink => x !== null)
    : undefined;

  const testResults =
    typeof j.testResults === "string" ? j.testResults : undefined;

  return { sections, prototypeLinks, testResults };
}

