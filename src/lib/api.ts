import { createClient } from "@/lib/supabase/client";
import type { DraftPayload } from "@/lib/draft";

export type { DraftPayload };

const BASE = "/api/v1";

const fetchOpts: RequestInit = { credentials: "include" };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  let code: string | undefined;
  let message = res.statusText;
  try {
    const j = (await res.json()) as {
      error?: { message?: string; code?: string };
    };
    message = j.error?.message ?? message;
    code = j.error?.code;
  } catch {
    /* body bukan JSON */
  }
  throw new ApiError(message, res.status, code);
}

export type ProjectResponse = {
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
};

export type JobResponse = {
  id: string;
  type: string;
  status: string;
  progress: number;
  error: string | null;
  projectId: string;
};

export type ProjectListItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  screenshotCount: number;
};

export type MeUser = {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  role: string;
  aiUsageCount: number;
  plan: {
    slug: string;
    name: string;
    maxProjects: number;
    maxScreenshotsPerProject: number;
    maxAiAnalysesPerPeriod: number;
    maxPdfExportsPerPeriod: number;
  } | null;
  usageThisMonth: {
    periodKey: string;
    ai_analysis: number;
    pdf_export: number;
  };
};

export async function getMe(): Promise<{ user: MeUser | null }> {
  const res = await fetch("/api/auth/me", { ...fetchOpts, cache: "no-store" });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function createCheckoutSession(body?: {
  successPath?: string;
}): Promise<{ url: string }> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function login(email: string, password: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<{ needsEmailConfirmation: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { name } } : undefined,
  });
  if (error) throw new Error(error.message);
  if (data.user && !data.session) {
    return { needsEmailConfirmation: true };
  }
  return { needsEmailConfirmation: false };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function listMyProjects(): Promise<{ projects: ProjectListItem[] }> {
  const res = await fetch(`${BASE}/projects`, { ...fetchOpts, cache: "no-store" });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function createProject(body?: {
  title?: string;
  locale?: string;
}): Promise<{ id: string; title: string }> {
  const res = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function getProject(id: string): Promise<ProjectResponse> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    cache: "no-store",
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function patchProject(
  id: string,
  body: {
    title?: string;
    jobFocus?: string;
    industry?: string;
    draft?: Partial<DraftPayload>;
  },
): Promise<ProjectResponse> {
  const res = await fetch(`${BASE}/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function uploadScreenshots(
  projectId: string,
  files: File[],
): Promise<{ screenshots: { id: string; previewUrl: string }[] }> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  const res = await fetch(`${BASE}/projects/${projectId}/screenshots`, {
    method: "POST",
    body: fd,
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function startAnalyze(projectId: string): Promise<{ jobId: string }> {
  const res = await fetch(`${BASE}/projects/${projectId}/analyze`, {
    method: "POST",
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${BASE}/jobs/${jobId}`, {
    cache: "no-store",
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function retryScreenshot(
  projectId: string,
  assetId: string,
  instruction?: string,
): Promise<ProjectResponse> {
  const res = await fetch(
    `${BASE}/projects/${projectId}/screenshots/${assetId}/retry`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(instruction ? { instruction } : {}),
      ...fetchOpts,
    },
  );
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function regenerateDraft(
  projectId: string,
  instruction: string,
): Promise<ProjectResponse> {
  const res = await fetch(`${BASE}/projects/${projectId}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction }),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function generateSectionsFromTemplate(
  projectId: string,
  templateId: string,
): Promise<ProjectResponse> {
  const res = await fetch(`${BASE}/projects/${projectId}/sections-from-template`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.json();
}

export async function downloadPdf(
  projectId: string,
  templateId: "default" | "compact" = "default",
): Promise<Blob> {
  const res = await fetch(`${BASE}/projects/${projectId}/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.blob();
}

export async function downloadBatchPdf(
  projectIds: string[],
  templateId: "default" | "compact" = "default",
): Promise<Blob> {
  const res = await fetch(`${BASE}/projects/batch-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectIds, templateId }),
    ...fetchOpts,
  });
  if (!res.ok) await throwIfNotOk(res);
  return res.blob();
}
