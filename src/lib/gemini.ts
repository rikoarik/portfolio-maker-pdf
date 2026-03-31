import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_GEMINI_MODEL } from "@/lib/constants";
import { resizeForVision } from "@/lib/image";
import type { DraftPayload, ScreenDraft } from "@/lib/draft";

export type VisionJson = {
  screen_title: string;
  features: string[];
  tech_guess: string[];
  ux_notes: string;
};

function getClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(key);
}

function modelName(override?: string): string {
  if (override === "pro") return "gemini-1.5-pro";
  if (override === "flash") return "gemini-1.5-flash";
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

function stripJsonFence(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "").trim();
  }
  return t;
}

export function parseVisionJson(text: string): VisionJson {
  const raw = stripJsonFence(text);
  const j = JSON.parse(raw) as Record<string, unknown>;
  return {
    screen_title: String(j.screen_title ?? j.screenTitle ?? "Screen"),
    features: Array.isArray(j.features)
      ? j.features.map((x) => String(x))
      : [],
    tech_guess: Array.isArray(j.tech_guess)
      ? j.tech_guess.map((x) => String(x))
      : Array.isArray(j.techGuess)
        ? j.techGuess.map((x) => String(x))
        : [],
    ux_notes: String(j.ux_notes ?? j.uxNotes ?? ""),
  };
}

export type PortfolioVisionContext = {
  roleFocus?: string;
  industry?: string;
};

export async function analyzeScreenshot(
  imageBytes: Buffer,
  mimeType: string,
  locale: string,
  extraInstruction?: string,
  requestedModelName?: string,
  portfolioContext?: PortfolioVisionContext,
): Promise<VisionJson> {
  const { buffer, mimeType: mt } = await resizeForVision(imageBytes);
  const gen = getClient();
  const model = gen.getGenerativeModel({ model: modelName(requestedModelName) });
  const extra =
    extraInstruction?.trim() ?
      `\nAdditional instruction from user: ${extraInstruction.trim()}`
    : "";
  const ctxParts: string[] = [];
  if (portfolioContext?.roleFocus?.trim()) {
    ctxParts.push(`Target role / audience: ${portfolioContext.roleFocus.trim()}.`);
  }
  if (portfolioContext?.industry?.trim()) {
    ctxParts.push(`Industry / domain: ${portfolioContext.industry.trim()}.`);
  }
  const ctx =
    ctxParts.length > 0 ?
      `\nContext: ${ctxParts.join(" ")} Describe the screen in terms relevant to that role (product, design, marketing, engineering, etc.), not only code.`
    : "";
  const prompt = `You analyze UI screenshots for a professional portfolio (any job type: engineering, design, product, marketing, etc.).
Return ONLY valid JSON (no markdown) with this shape:
{"screen_title":"string","features":["short bullet", "..."],"tech_guess":["React","..."],"ux_notes":"one paragraph"}
Rules:
- features: max 5 items, concrete UI elements visible.
- tech_guess: inferred stack/tools if visible, else empty array (can be design tools, analytics, not only code).
- Write in language: ${locale === "id" ? "Indonesian" : "English"}.
${ctx}${extra}`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: mt,
        data: buffer.toString("base64"),
      },
    },
  ]);
  const out = result.response.text();
  return parseVisionJson(out);
}

export async function aggregateProjectNarrative(
  draft: DraftPayload,
  locale: string,
  requestedModelName?: string,
  portfolioContext?: PortfolioVisionContext,
): Promise<{ projectSummary: string; techStack: string[] }> {
  const gen = getClient();
  const model = gen.getGenerativeModel({ model: modelName(requestedModelName) });
  const lines = draft.screens.map(
    (s: ScreenDraft) =>
      `- ${s.title}: ${s.bullets.join("; ")} ${s.notes ? `Notes: ${s.notes}` : ""}`,
  );
  const focus =
    portfolioContext?.roleFocus?.trim() || portfolioContext?.industry?.trim() ?
      `\nAudience: ${portfolioContext?.roleFocus ?? "general professional"}. Domain: ${portfolioContext?.industry ?? "general"}.`
    : "";
  const prompt = `You merge UI screen notes into a portfolio project summary.
Screens:
${lines.join("\n")}
${focus}

Return ONLY valid JSON: {"project_summary":"2-4 sentences","tech_stack":["unique","skills"]}
Language: ${locale === "id" ? "Indonesian" : "English"}.
tech_stack: skills/tools relevant to the role (can include soft tools, design, analytics, not only programming), max 12 short tokens.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = stripJsonFence(text);
  const j = JSON.parse(raw) as Record<string, unknown>;
  return {
    projectSummary: String(j.project_summary ?? j.projectSummary ?? ""),
    techStack: Array.isArray(j.tech_stack)
      ? j.tech_stack.map((x) => String(x))
      : Array.isArray(j.techStack)
        ? j.techStack.map((x) => String(x))
        : [],
  };
}

export async function regenerateDraftWithInstruction(
  draft: DraftPayload,
  locale: string,
  instruction: string,
  requestedModelName?: string,
): Promise<DraftPayload> {
  const gen = getClient();
  const model = gen.getGenerativeModel({ model: modelName(requestedModelName) });
  const prompt = `You improve portfolio / case-study draft content for job applications (any profession: design, marketing, PM, engineering, etc.).
Current JSON draft:
${JSON.stringify(draft)}

User instruction:
${instruction}

Return ONLY valid JSON with this exact shape (no markdown):
{"projectSummary":"string","techStack":["..."],"screens":[{"assetId":"id","title":"string","bullets":["..."],"notes":"string"}]}
Keep every assetId from the input screens array; you may edit titles, bullets, notes. Prefer outcomes and impact over buzzwords.
Language for text fields: ${locale === "id" ? "Indonesian" : "English"}.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = stripJsonFence(text);
  const j = JSON.parse(raw) as Record<string, unknown>;
  const screensRaw = Array.isArray(j.screens) ? j.screens : [];
  const screens: ScreenDraft[] = screensRaw.map((s: Record<string, unknown>) => ({
    assetId: String(s.assetId ?? ""),
    title: String(s.title ?? ""),
    bullets: Array.isArray(s.bullets)
      ? s.bullets.map((x) => String(x))
      : [],
    notes: String(s.notes ?? ""),
  }));
  return {
    ...draft,
    draftVersion: draft.draftVersion ?? 1,
    projectSummary: String(j.projectSummary ?? j.project_summary ?? ""),
    techStack: Array.isArray(j.techStack)
      ? j.techStack.map((x) => String(x))
      : Array.isArray(j.tech_stack)
        ? j.tech_stack.map((x) => String(x))
        : [],
    screens,
  };
}
