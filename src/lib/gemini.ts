import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
} from "@/lib/constants";
import { resizeForVision } from "@/lib/image";
import type { DraftPayload, ScreenDraft } from "@/lib/draft";

export type VisionJson = {
  screen_title: string;
  features: string[];
  tech_guess: string[];
  ux_notes: string;
};

function getClient(apiKey?: string): GoogleGenerativeAI {
  const key = apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(key);
}

function modelName(override?: string): string {
  if (override === "pro") {
    return process.env.GEMINI_PRO_MODEL ?? DEFAULT_GEMINI_PRO_MODEL;
  }
  if (override === "flash") {
    return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  }
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
  /** Draft template id (e.g. backend_api, uiux) — steers vocabulary for evidence images */
  templateId?: string;
  /** Onboarding persona id — same intent as templateId for narrative */
  portfolioPersona?: string;
};

function portfolioAngleDescription(ctx?: PortfolioVisionContext): string {
  const tid = ctx?.templateId?.trim();
  const pid = ctx?.portfolioPersona?.trim();
  const id = tid || pid || "";
  if (id === "backend_api")
    return "This evidence is likely APIs, infrastructure, diagrams, dashboards, or logs—emphasize reliability, data flow, and technical decisions.";
  if (id === "frontend_web" || id === "mobile")
    return "This evidence is likely UI implementation—emphasize components, UX patterns, platform, and implementation quality.";
  if (id === "uiux")
    return "This evidence is likely design work—emphasize user problems, flows, and design decisions.";
  if (id === "product")
    return "This evidence may include metrics, roadmaps, or product UI—emphasize outcomes and decisions.";
  return "Adapt emphasis to the user's job focus and industry below.";
}

export async function analyzeScreenshot(
  imageBytes: Buffer,
  mimeType: string,
  locale: string,
  extraInstruction?: string,
  requestedModelName?: string,
  portfolioContext?: PortfolioVisionContext,
  apiKey?: string,
): Promise<VisionJson> {
  const { buffer, mimeType: mt } = await resizeForVision(imageBytes);
  const gen = getClient(apiKey);
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
  const angle = portfolioAngleDescription(portfolioContext);
  const ctx =
    ctxParts.length > 0 ?
      `\nContext: ${ctxParts.join(" ")} ${angle}`
    : angle ?
      `\nContext: ${angle}`
    : "";
  const prompt = `You analyze images for a professional portfolio (screenshots of apps, websites, API tools, diagrams, dashboards, design files, etc.).
Return ONLY valid JSON (no markdown) with this shape:
{"screen_title":"string","features":["short bullet", "..."],"tech_guess":["React","..."],"ux_notes":"one paragraph"}
Rules:
- features: max 5 items, concrete visible elements (UI widgets, chart types, endpoints, diagram blocks, etc.).
- tech_guess: inferred stack/tools/platforms if visible, else empty array.
- ux_notes: for non-UI images, summarize what the evidence shows and why it matters for the role.
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
  apiKey?: string,
): Promise<{ projectSummary: string; techStack: string[] }> {
  const gen = getClient(apiKey);
  const model = gen.getGenerativeModel({ model: modelName(requestedModelName) });
  const lines = draft.screens.map(
    (s: ScreenDraft) =>
      `- ${s.title}: ${s.bullets.join("; ")} ${s.notes ? `Notes: ${s.notes}` : ""}`,
  );
  const focus =
    portfolioContext?.roleFocus?.trim() || portfolioContext?.industry?.trim() ?
      `\nAudience: ${portfolioContext?.roleFocus ?? "general professional"}. Domain: ${portfolioContext?.industry ?? "general"}.`
    : "";
  const angle = portfolioAngleDescription(portfolioContext);
  const prompt = `You merge per-image portfolio notes into one project summary.
Screens:
${lines.join("\n")}
${focus}
Portfolio angle: ${angle}

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

export type RegenerateContext = {
  jobFocus?: string;
  industry?: string;
  templateId?: string;
  portfolioPersona?: string;
};

export type NarrativeMode = "auto" | "rewrite";
export type NarrativeInput = {
  problem?: string;
  solution?: string;
  impact?: string;
};
export type NarrativeOutput = {
  problemSummary: string;
  solutionSummary: string;
  impactSummary: string;
  warnings: string[];
};

function enforceHypothesisImpact(rawImpact: string): {
  impact: string;
  warning?: string;
} {
  const t = rawImpact.trim();
  if (!t) {
    return {
      impact:
        "Perubahan ini diperkirakan meningkatkan pengalaman pengguna dan efisiensi alur utama.",
      warning: "impact_defaulted_hypothesis",
    };
  }
  const low = t.toLowerCase();
  const hasHypothesisWord =
    low.includes("diperkirakan") ||
    low.includes("berpotensi") ||
    low.includes("indikasi") ||
    low.includes("kemungkinan");
  if (hasHypothesisWord) return { impact: t };
  const hasNumericClaim = /\d+([.,]\d+)?\s*%?/.test(t);
  if (hasNumericClaim) {
    return {
      impact:
        "Perubahan ini berpotensi meningkatkan metrik utama berdasarkan pola penggunaan, namun angka final perlu divalidasi dengan data produksi.",
      warning: "impact_numeric_claim_removed",
    };
  }
  return {
    impact: `Dampak awal menunjukkan ${t.charAt(0).toLowerCase()}${t.slice(1)} dan berpotensi meningkat setelah validasi data.`,
    warning: "impact_normalized_hypothesis",
  };
}

export async function generateNarrativeBlocks(opts: {
  mode: NarrativeMode;
  locale: string;
  draft: DraftPayload;
  title: string;
  roleFocus?: string;
  industry?: string;
  manualInput?: NarrativeInput;
  requestedModelName?: string;
  apiKey?: string;
}): Promise<NarrativeOutput> {
  const gen = getClient(opts.apiKey);
  const model = gen.getGenerativeModel({ model: modelName(opts.requestedModelName) });
  const screenLines = opts.draft.screens.map(
    (s) => `- ${s.title || "Layar"}: ${s.bullets.join("; ")} ${s.notes ? `(notes: ${s.notes})` : ""}`,
  );
  const rewriteSeed =
    opts.mode === "rewrite"
      ? `\nManual input:\nproblem=${opts.manualInput?.problem ?? ""}\nsolution=${opts.manualInput?.solution ?? ""}\nimpact=${opts.manualInput?.impact ?? ""}`
      : "";
  const prompt = `You are helping create a concise project portfolio narrative.
Return ONLY valid JSON:
{"problem":"1-2 kalimat","solution":"1-3 kalimat","impact":"1-2 kalimat","warnings":["..."]}.

Rules:
- Language: ${opts.locale === "id" ? "Indonesian" : "English"}.
- Keep concise and practical.
- Impact must stay as hypothesis unless explicit data is given, use words like "diperkirakan", "berpotensi", or "indikasi".
- Avoid guaranteed numeric claims.

Mode: ${opts.mode}
Project title: ${opts.title || "Untitled project"}
Role focus: ${opts.roleFocus ?? "general"}
Industry: ${opts.industry ?? "general"}
Screens evidence:
${screenLines.join("\n")}
Current summary: ${opts.draft.projectSummary}
${rewriteSeed}`;
  const result = await model.generateContent(prompt);
  const raw = stripJsonFence(result.response.text());
  const j = JSON.parse(raw) as Record<string, unknown>;
  const problemSummary = String(j.problem ?? "").trim();
  const solutionSummary = String(j.solution ?? "").trim();
  const impactRaw = String(j.impact ?? "").trim();
  const warningList = Array.isArray(j.warnings)
    ? j.warnings.map((w) => String(w))
    : [];
  const normalizedImpact = enforceHypothesisImpact(impactRaw);
  if (normalizedImpact.warning) warningList.push(normalizedImpact.warning);
  return {
    problemSummary,
    solutionSummary,
    impactSummary: normalizedImpact.impact,
    warnings: warningList,
  };
}

export async function regenerateDraftWithInstruction(
  draft: DraftPayload,
  locale: string,
  instruction: string,
  requestedModelName?: string,
  portfolioContext?: RegenerateContext,
  apiKey?: string,
): Promise<DraftPayload> {
  const gen = getClient(apiKey);
  const model = gen.getGenerativeModel({ model: modelName(requestedModelName) });
  const ctxBits: string[] = [];
  if (portfolioContext?.jobFocus?.trim()) {
    ctxBits.push(`Job focus: ${portfolioContext.jobFocus.trim()}`);
  }
  if (portfolioContext?.industry?.trim()) {
    ctxBits.push(`Industry: ${portfolioContext.industry.trim()}`);
  }
  if (portfolioContext?.templateId?.trim() || portfolioContext?.portfolioPersona?.trim()) {
    ctxBits.push(
      `Portfolio template/persona: ${portfolioContext.templateId ?? portfolioContext.portfolioPersona ?? ""}`,
    );
  }
  const ctxLine =
    ctxBits.length > 0 ? `\nContext for tone and emphasis: ${ctxBits.join(". ")}.` : "";
  const prompt = `You improve portfolio / case-study draft content for job applications (any profession: design, marketing, PM, engineering, etc.).
Current JSON draft:
${JSON.stringify(draft)}
${ctxLine}

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
