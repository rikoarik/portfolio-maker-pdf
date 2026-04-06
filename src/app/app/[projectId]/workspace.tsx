"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOTS_PER_PROJECT,
} from "@/lib/constants";
import { createEmptyCaseStudy } from "@/lib/draft";
import {
  ApiError,
  downloadPdf,
  getJob,
  getProject,
  generateSectionsFromTemplate,
  patchProject,
  regenerateDraft,
  retryScreenshot,
  startAnalyze,
  uploadScreenshots,
  type ProjectResponse,
} from "@/lib/api";
import { PersonaOnboardingModal } from "@/components/workspace/persona-onboarding-modal";
import { ScreenDraftsEditor } from "@/components/workspace/screen-drafts-editor";
import { WorkspaceSubnav } from "@/components/workspace/workspace-subnav";
import {
  generateTemplateSections,
  listTemplates,
  type OnboardingPersonaCard,
} from "@/lib/template-sections";
import {
  industryPlaceholder,
  jobFocusPlaceholder,
  screenshotDropzoneHint,
  templateNoteForSelect,
  workspaceHeroSubtitle,
} from "@/lib/workspace-copy";
import Link from "next/link";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatClientApiError(e: unknown): string {
  if (e instanceof ApiError && e.code === "quota_exceeded") {
    return `${e.message} Lihat /pricing untuk upgrade paket.`;
  }
  return e instanceof Error ? e.message : "Terjadi kesalahan.";
}

function shouldOfferPersonaOnboarding(p: ProjectResponse): boolean {
  const d = p.draft;
  if (d.portfolioPersona) return false;
  if (p.screenshots.length > 0) return false;
  if (d.projectSummary.trim()) return false;
  if ((d.sections?.length ?? 0) > 0) return false;
  if (d.templateId) return false;
  if (d.screens.some((s) => s.title.trim() || s.bullets.length > 0)) {
    return false;
  }
  return true;
}

const SECTION_TEMPLATES = listTemplates();

export function Workspace({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [privacyOk, setPrivacyOk] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState<"default" | "compact">(
    "default",
  );
  const [regenInstr, setRegenInstr] = useState("");
  const [newProtoLabel, setNewProtoLabel] = useState("");
  const [newProtoUrl, setNewProtoUrl] = useState("");
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [contentStep, setContentStep] = useState(0);

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const jobQ = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      if (!s || s === "completed" || s === "failed") return false;
      return 1200;
    },
  });

  const uploadMut = useMutation({
    mutationFn: (files: File[]) => uploadScreenshots(projectId, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const analyzeMut = useMutation({
    mutationFn: () => startAnalyze(projectId),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const saveDraft = useMutation({
    mutationFn: (draft: ProjectResponse["draft"]) =>
      patchProject(projectId, { draft }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      setSaveHint("Tersimpan");
      window.setTimeout(() => setSaveHint(null), 2200);
    },
  });

  useEffect(() => {
    if (saveDraft.isPending) setSaveHint("Menyimpan…");
  }, [saveDraft.isPending]);

  const pdfMut = useMutation({
    mutationFn: () => downloadPdf(projectId, pdfTemplate),
    onSuccess: (blob) => {
      triggerDownload(blob, `portfolio-${projectId}.pdf`);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const regenMut = useMutation({
    mutationFn: () => regenerateDraft(projectId, regenInstr.trim()),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], data);
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const genSectionsMut = useMutation({
    mutationFn: (templateId: string) =>
      generateSectionsFromTemplate(projectId, templateId),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], data);
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const retryMut = useMutation({
    mutationFn: (assetId: string) => retryScreenshot(projectId, assetId),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], data);
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const personaMut = useMutation({
    mutationFn: (body: {
      jobFocus?: string;
      draft: Partial<ProjectResponse["draft"]>;
    }) => patchProject(projectId, body),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], data);
      setLocalError(null);
    },
    onError: (e: unknown) => setLocalError(formatClientApiError(e)),
  });

  const onFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const files = Array.from(list);
      const count = projectQ.data?.screenshots.length ?? 0;
      if (count + files.length > MAX_SCREENSHOTS_PER_PROJECT) {
        setLocalError(`Maksimal ${MAX_SCREENSHOTS_PER_PROJECT} gambar per proyek.`);
        return;
      }
      for (const f of files) {
        if (f.size > MAX_SCREENSHOT_BYTES) {
          setLocalError(
            `Berkas terlalu besar (maks ${Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024)} MB).`,
          );
          return;
        }
      }
      uploadMut.mutate(files);
    },
    [projectQ.data?.screenshots.length, uploadMut],
  );

  const project = projectQ.data;
  const job = jobQ.data;

  const showPersonaModal = useMemo(
    () => (project ? shouldOfferPersonaOnboarding(project) : false),
    [project],
  );

  useEffect(() => {
    if (job?.status === "completed") {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    }
  }, [job?.status, projectId, qc]);

  if (projectQ.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <span className="text-sm text-zinc-500">Memuat proyek…</span>
        </div>
      </div>
    );
  }
  if (projectQ.isError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
        </div>
        <p className="text-red-600 font-medium">Gagal memuat proyek.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/app" className="text-indigo-600 font-medium hover:underline">Proyek saya</Link>
          <Link href="/" className="text-indigo-600 font-medium hover:underline">Beranda</Link>
        </div>
      </div>
    );
  }

  const draft = project!.draft;
  const analyzing =
    job?.status === "queued" ||
    job?.status === "running" ||
    analyzeMut.isPending;

  const projectTitle = project!.title.trim() || "Tanpa judul";
  const selectedTemplate = draft.templateId
    ? generateTemplateSections(draft.templateId)
    : null;

  const heroSub = workspaceHeroSubtitle(draft.templateId, draft.portfolioPersona);
  const dropHint = screenshotDropzoneHint(draft.templateId, draft.portfolioPersona);
  const jobPh = jobFocusPlaceholder(draft.templateId, draft.portfolioPersona);

  function pickPersona(card: OnboardingPersonaCard) {
    const nextJob =
      !project!.jobFocus.trim() ? card.suggestedJobFocus : undefined;
    personaMut.mutate({
      ...(nextJob !== undefined ? { jobFocus: nextJob } : {}),
      draft: {
        templateId: card.templateId,
        portfolioPersona: card.personaId,
      },
    });
  }

  function skipPersona() {
    personaMut.mutate({ draft: { portfolioPersona: "skipped" } });
  }

  const STEPS = [
    { id: "upload", label: "Upload", icon: "📸" },
    { id: "analyze", label: "Analisis AI", icon: "✨" },
    { id: "content", label: "Konten", icon: "✏️" },
    { id: "export", label: "Export", icon: "📄" },
  ];

  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  return (
    <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PersonaOnboardingModal
        open={showPersonaModal}
        onPick={pickPersona}
        onSkip={skipPersona}
      />

      <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start relative">
        {/* Left Column - Form Steps */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6">

      {/* Header */}
      <header className="mb-6">
        <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/app" className="flex items-center gap-1 hover:text-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
            Proyek
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-zinc-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span className="font-medium text-zinc-700 truncate max-w-[200px]">{projectTitle}</span>
          {saveHint ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600" aria-live="polite">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              {saveHint}
            </span>
          ) : null}
        </nav>
      </header>

      {/* Stepper */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm">
        <div className="flex">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isPast = i < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-md"
                    : isPast
                      ? "text-indigo-600 hover:bg-indigo-50"
                      : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span className={`hidden sm:inline text-base ${isActive ? "" : isPast ? "opacity-80" : "opacity-40"}`}>{s.icon}</span>
                <span>{s.label}</span>
                {isPast && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-indigo-500"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {localError ? (
        <div
          className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          {localError}
        </div>
      ) : null}

      {/* Step Content */}
      <div className="animate-fade-in-up" key={step}>

      {/* ===== STEP 0: Upload ===== */}
      {step === 0 && (
      <section className="space-y-6">
        <label className="upload-zone flex cursor-pointer flex-col items-center justify-center text-center">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            disabled={uploadMut.isPending}
          />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              {uploadMut.isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" /></svg>
              )}
            </div>
            <span className="text-sm font-medium text-zinc-700">
              {uploadMut.isPending ? "Mengunggah…" : dropHint}
            </span>
            <span className="mt-1 text-xs text-zinc-400">
              Maks {MAX_SCREENSHOTS_PER_PROJECT} file, {Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024)} MB per file
            </span>
          </div>
        </label>

        {project!.screenshots.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {project!.screenshots.map((s, idx) => (
              <li
                key={s.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.previewUrl} alt={`Layar ${idx + 1}`} className="h-full w-full object-cover object-top transition-transform group-hover:scale-105" />
                  <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900/70 text-[10px] font-bold text-white backdrop-blur-sm">{idx + 1}</div>
                </div>
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-xs font-medium text-zinc-600">Layar {idx + 1}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${s.analysisStatus === 'done' ? 'bg-emerald-50 text-emerald-700' : s.analysisStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-500'}`}>{s.analysisStatus}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      )}

      {/* ===== STEP 1: AI Analysis ===== */}
      {step === 1 && (
      <>

      <section className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {!privacyOk ? (
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-100 hover:border-zinc-300"
              >
                🔒 Setujui privasi & analisis AI
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Privasi disetujui
              </span>
            )}
            <button
              type="button"
              disabled={!privacyOk || project!.screenshots.length === 0 || analyzing}
              onClick={() => analyzeMut.mutate()}
              className="btn-primary !rounded-xl !text-sm"
              title={!privacyOk ? "Setujui privasi terlebih dahulu" : "Jalankan analisis"}
            >
              {analyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menganalisis… {job?.progress ?? 0}%
                </>
              ) : (
                <>✨ Analisis dengan AI</>
              )}
            </button>
          </div>
          {analyzing && job?.progress != null && (
            <div className="mt-4 progress-bar"><div className="progress-bar-fill" style={{ width: `${job.progress}%` }} /></div>
          )}
          {process.env.NODE_ENV === "development" ? (
            <p className="mt-3 text-xs text-zinc-400">
              Dev: tanpa <code className="rounded bg-zinc-100 px-1 text-zinc-600">GEMINI_API_KEY</code> di <code className="rounded bg-zinc-100 px-1 text-zinc-600">.env</code>, analisis gagal.
            </p>
          ) : null}
        </div>

        {/* Screenshot thumbnails in AI step for reference */}
        {project!.screenshots.length > 0 && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500 mb-3">{project!.screenshots.length} screenshot diunggah</p>
            <div className="flex gap-2 overflow-x-auto">
              {project!.screenshots.map((s, idx) => (
                <div key={s.id} className="relative shrink-0 w-12 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.previewUrl} alt="" className="h-full w-full object-cover object-top" />
                  <div className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded bg-zinc-900/60 text-[8px] font-bold text-white">{idx + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      </>
      )}

      {/* ===== STEP 2: Content ===== */}
      {step === 2 && (
      <>

      {showPrivacy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            className="animate-scale-in max-h-[90vh] max-w-md overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 text-center">Pengiriman gambar ke AI</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 text-center">
              Gambar bukti akan diproses oleh layanan Google Gemini melalui backend kami. Jangan mengunggah data sensitif, kata sandi, atau informasi pribadi orang lain. Lihat juga halaman{" "}
              <Link href="/privacy" className="text-indigo-600 font-medium hover:underline">Privasi</Link>.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors" onClick={() => setShowPrivacy(false)}>Batal</button>
              <button type="button" className="btn-primary flex-1 !py-2.5 !rounded-xl !text-sm" onClick={() => { setPrivacyOk(true); setShowPrivacy(false); }}>Saya mengerti</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Content Sub-nav */}
      {(() => {
        const CONTENT_TABS = [
          { label: "Informasi Dasar", icon: "📝" },
          { label: "Template & Ringkasan", icon: "📋" },
          { label: "Sections & Detail", icon: "🧩" },
          { label: "Perbaiki AI", icon: "✨" },
        ];
        return (
          <div className="mb-6 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
            {CONTENT_TABS.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setContentStep(i)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] sm:text-xs font-medium transition-all ${
                  i === contentStep
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                }`}
              >
                <span className="hidden sm:inline">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Sub-step 0: Informasi Dasar */}
      {contentStep === 0 && (
      <section className="space-y-5 animate-fade-in-up" key="cs0">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </span>
            Informasi Dasar
          </h2>
          <p className="text-xs text-zinc-500">Isi data dasar proyek dan target pekerjaan.</p>
        </div>

        <label className="block animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <span className="text-xs font-medium text-zinc-600">Judul proyek</span>
          <input
            className="input-field mt-1"
            placeholder="Mis: Aplikasi E-Commerce Mobile"
            value={project!.title}
            onChange={(e) => {
              const title = e.target.value;
              qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                old ? { ...old, title } : old,
              );
            }}
            onBlur={(e) => {
              patchProject(projectId, { title: e.target.value }).catch(() => {});
            }}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">
              Fokus pekerjaan / lamaran
            </span>
            <input
              className="input-field mt-1"
              placeholder={jobPh}
              value={project!.jobFocus}
              onChange={(e) => {
                const jobFocus = e.target.value;
                qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                  old ? { ...old, jobFocus } : old,
                );
              }}
              onBlur={(e) => {
                patchProject(projectId, { jobFocus: e.target.value }).catch(
                  () => {},
                );
              }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Industri / domain</span>
            <input
              className="input-field mt-1"
              placeholder={industryPlaceholder()}
              value={project!.industry}
              onChange={(e) => {
                const industry = e.target.value;
                qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                  old ? { ...old, industry } : old,
                );
              }}
              onBlur={(e) => {
                patchProject(projectId, { industry: e.target.value }).catch(
                  () => {},
                );
              }}
            />
          </label>
        </div>

        <label className="block animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <span className="text-xs font-medium text-zinc-600">
            Profil pembaca (untuk PDF)
          </span>
          <input
            className="input-field mt-1"
            placeholder="Mis. Hiring manager non-teknis"
            value={draft.roleFocus ?? ""}
            onChange={(e) => {
              const roleFocus = e.target.value;
              qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                old
                  ? {
                      ...old,
                      draft: { ...old.draft, roleFocus },
                    }
                  : old,
              );
            }}
            onBlur={() => {
              const d = qc.getQueryData(["project", projectId]) as
                | ProjectResponse
                | undefined;
              if (d) saveDraft.mutate(d.draft);
            }}
          />
        </label>

        <div className="animate-fade-in-up flex justify-end pt-2" style={{ animationDelay: '240ms' }}>
          <button
            type="button"
            onClick={() => setContentStep(1)}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98]"
          >
            Lanjut ke Template
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </section>
      )}

      {/* Sub-step 1: Template & Ringkasan */}
      {contentStep === 1 && (
      <section className="space-y-5 animate-fade-in-up" key="cs1">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </span>
            Template & Ringkasan
          </h2>
          <p className="text-xs text-zinc-500">Pilih template dan isi ringkasan proyek.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Jenis portofolio (template)</span>
            <select
              className="input-field mt-1"
              value={draft.templateId ?? ""}
              onChange={(e) => {
                const templateId = e.target.value || undefined;
                qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                  old
                    ? { ...old, draft: { ...old.draft, templateId } }
                    : old,
                );
              }}
              onBlur={() => {
                const d = qc.getQueryData(["project", projectId]) as
                  | ProjectResponse
                  | undefined;
                if (d) saveDraft.mutate(d.draft);
              }}
            >
              <option value="">(tanpa template)</option>
              {SECTION_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-800">Tentang template ini</p>
            <p className="mt-1">{templateNoteForSelect(selectedTemplate)}</p>
          </div>
        </div>

        <label className="block animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <span className="text-xs font-medium text-zinc-600">Ringkasan (boleh diedit)</span>
          <textarea
            className="input-field mt-1 min-h-[100px] resize-y"
            placeholder="Ringkasan proyek Anda…"
            value={draft.projectSummary}
            onChange={(e) => {
              const v = e.target.value;
              qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                old
                  ? {
                      ...old,
                      draft: { ...old.draft, projectSummary: v },
                    }
                  : old,
              );
            }}
            onBlur={() => {
              const d = qc.getQueryData(["project", projectId]) as
                | ProjectResponse
                | undefined;
              if (d) saveDraft.mutate(d.draft);
            }}
          />
        </label>

        <label className="block animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <span className="text-xs font-medium text-zinc-600">Tech stack (pisahkan koma)</span>
          <input
            className="input-field mt-1"
            placeholder="React, TypeScript, Node.js"
            value={draft.techStack.join(", ")}
            onChange={(e) => {
              const techStack = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                old
                  ? {
                      ...old,
                      draft: { ...old.draft, techStack },
                    }
                  : old,
              );
            }}
            onBlur={() => {
              const d = qc.getQueryData(["project", projectId]) as
                | ProjectResponse
                | undefined;
              if (d) saveDraft.mutate(d.draft);
            }}
          />
        </label>

        <label className="block animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <span className="text-xs font-medium text-zinc-600">Sorotan (satu baris = satu poin)</span>
          <textarea
            className="input-field mt-1 min-h-[72px] resize-y"
            placeholder={"Contoh:\nMeningkatkan konversi 12%\nKolaborasi lintas tim"}
            value={(draft.highlights ?? []).join("\n")}
            onChange={(e) => {
              const highlights = e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                old
                  ? {
                      ...old,
                      draft: {
                        ...old.draft,
                        highlights: highlights.length ? highlights : undefined,
                      },
                    }
                  : old,
              );
            }}
            onBlur={() => {
              const d = qc.getQueryData(["project", projectId]) as
                | ProjectResponse
                | undefined;
              if (d) saveDraft.mutate(d.draft);
            }}
          />
        </label>

        <div className="animate-fade-in-up flex items-center justify-between pt-2" style={{ animationDelay: '300ms' }}>
          <button type="button" onClick={() => setContentStep(0)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 active:scale-[0.98]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Kembali
          </button>
          <button type="button" onClick={() => setContentStep(2)} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-[0.98]">
            Lanjut ke Sections
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </section>
      )}

      {/* Sub-step 2: Sections & Detail */}
      {contentStep === 2 && (
      <section className="space-y-5 animate-fade-in-up" key="cs2">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            </span>
            Sections & Detail
          </h2>
          <p className="text-xs text-zinc-500">Kelola bab portofolio, link prototype, dan studi kasus.</p>
        </div>

        {/* Sections */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-zinc-800">
              Sections (fleksibel)
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200"
                onClick={() => {
                  const d = qc.getQueryData(["project", projectId]) as
                    | ProjectResponse
                    | undefined;
                  if (!d) return;

                  const seed = selectedTemplate?.sections ?? [];
                  const hasAny = (d.draft.sections ?? []).length > 0;
                  if (!hasAny && seed.length > 0) {
                    const sections = seed.map((s) => ({
                      id: `sec_${Math.random().toString(36).slice(2, 10)}`,
                      label: s.label,
                      content: "",
                      templateKey: s.templateKey,
                    }));
                    const nextDraft = { ...d.draft, sections };
                    qc.setQueryData(["project", projectId], {
                      ...d,
                      draft: nextDraft,
                    });
                    saveDraft.mutate(nextDraft);
                    return;
                  }

                  const sections = [
                    ...(d.draft.sections ?? []),
                    {
                      id: `sec_${Math.random().toString(36).slice(2, 10)}`,
                      label: "",
                      content: "",
                    },
                  ];
                  const nextDraft = { ...d.draft, sections };
                  qc.setQueryData(["project", projectId], {
                    ...d,
                    draft: nextDraft,
                  });
                  saveDraft.mutate(nextDraft);
                }}
              >
                {(draft.sections ?? []).length === 0 && selectedTemplate
                  ? "Buat kerangka dari template"
                  : "+ Section"}
              </button>
              {selectedTemplate ? (
                <button
                  type="button"
                  className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  disabled={
                    genSectionsMut.isPending || !project?.jobFocus?.trim()
                  }
                  onClick={() => genSectionsMut.mutate(selectedTemplate.id)}
                  title={
                    !project?.jobFocus?.trim()
                      ? "Isi fokus pekerjaan/role terlebih dahulu"
                      : "Isi section dengan AI"
                  }
                >
                  {genSectionsMut.isPending
                    ? "Generating…"
                    : "Isi section dengan AI"}
                </button>
              ) : null}
            </div>
          </div>
          {(draft.sections ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Pilih template lalu klik &quot;Buat kerangka dari template&quot;,
              atau tambah section manual.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {(draft.sections ?? []).map((sec, sidx) => (
                <li
                  key={sec.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs text-zinc-500">
                      Judul section
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-40"
                        disabled={sidx === 0}
                        onClick={() => {
                          const d = qc.getQueryData(["project", projectId]) as
                            | ProjectResponse
                            | undefined;
                          if (!d) return;
                          const sections = [...(d.draft.sections ?? [])];
                          const tmp = sections[sidx - 1];
                          sections[sidx - 1] = sections[sidx];
                          sections[sidx] = tmp;
                          const nextDraft = { ...d.draft, sections };
                          qc.setQueryData(["project", projectId], {
                            ...d,
                            draft: nextDraft,
                          });
                          saveDraft.mutate(nextDraft);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-40"
                        disabled={sidx === (draft.sections?.length ?? 0) - 1}
                        onClick={() => {
                          const d = qc.getQueryData(["project", projectId]) as
                            | ProjectResponse
                            | undefined;
                          if (!d) return;
                          const sections = [...(d.draft.sections ?? [])];
                          const tmp = sections[sidx + 1];
                          sections[sidx + 1] = sections[sidx];
                          sections[sidx] = tmp;
                          const nextDraft = { ...d.draft, sections };
                          qc.setQueryData(["project", projectId], {
                            ...d,
                            draft: nextDraft,
                          });
                          saveDraft.mutate(nextDraft);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200"
                        onClick={() => {
                          const d = qc.getQueryData(["project", projectId]) as
                            | ProjectResponse
                            | undefined;
                          if (!d) return;
                          const sections = (d.draft.sections ?? []).filter(
                            (x) => x.id !== sec.id,
                          );
                          const nextDraft = {
                            ...d.draft,
                            sections: sections.length ? sections : undefined,
                          };
                          qc.setQueryData(["project", projectId], {
                            ...d,
                            draft: nextDraft,
                          });
                          saveDraft.mutate(nextDraft);
                        }}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <input
                    className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                    value={sec.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      qc.setQueryData(
                        ["project", projectId],
                        (old: ProjectResponse | undefined) => {
                          if (!old) return old;
                          const sections = [...(old.draft.sections ?? [])];
                          sections[sidx] = { ...sections[sidx], label };
                          return {
                            ...old,
                            draft: { ...old.draft, sections },
                          };
                        },
                      );
                    }}
                    onBlur={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (d) saveDraft.mutate(d.draft);
                    }}
                  />
                  <label className="mt-2 block text-xs text-zinc-500">Isi</label>
                  <textarea
                    className="mt-1 min-h-[56px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                    value={sec.content}
                    onChange={(e) => {
                      const content = e.target.value;
                      qc.setQueryData(
                        ["project", projectId],
                        (old: ProjectResponse | undefined) => {
                          if (!old) return old;
                          const sections = [...(old.draft.sections ?? [])];
                          sections[sidx] = { ...sections[sidx], content };
                          return {
                            ...old,
                            draft: { ...old.draft, sections },
                          };
                        },
                      );
                    }}
                    onBlur={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (d) saveDraft.mutate(d.draft);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prototype Links */}
        {selectedTemplate?.supports.prototypeLinks ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <h3 className="text-sm font-medium text-zinc-800">Link prototype</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                placeholder="Label (mis. Figma, demo live)"
                value={newProtoLabel}
                onChange={(e) => setNewProtoLabel(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                placeholder="https://..."
                value={newProtoUrl}
                onChange={(e) => setNewProtoUrl(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={!newProtoLabel.trim() || !newProtoUrl.trim()}
                onClick={() => {
                  const d = qc.getQueryData(["project", projectId]) as
                    | ProjectResponse
                    | undefined;
                  if (!d) return;
                  const prototypeLinks = [
                    ...(d.draft.prototypeLinks ?? []),
                    { label: newProtoLabel.trim(), url: newProtoUrl.trim() },
                  ];
                  const nextDraft = { ...d.draft, prototypeLinks };
                  qc.setQueryData(["project", projectId], {
                    ...d,
                    draft: nextDraft,
                  });
                  saveDraft.mutate(nextDraft);
                  setNewProtoLabel("");
                  setNewProtoUrl("");
                }}
              >
                Tambah
              </button>
            </div>

            {(draft.prototypeLinks ?? []).length > 0 ? (
              <ul className="mt-3 space-y-2">
                {(draft.prototypeLinks ?? []).map((l, idx) => (
                  <li
                    key={`${l.url}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">
                        {l.label}
                      </p>
                      <p className="truncate font-mono text-xs text-zinc-600">
                        {l.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-700 underline"
                      onClick={() => {
                        const d = qc.getQueryData(["project", projectId]) as
                          | ProjectResponse
                          | undefined;
                        if (!d) return;
                        const prototypeLinks = (
                          d.draft.prototypeLinks ?? []
                        ).filter((_, i) => i !== idx);
                        const nextDraft = {
                          ...d.draft,
                          prototypeLinks: prototypeLinks.length
                            ? prototypeLinks
                            : undefined,
                        };
                        qc.setQueryData(["project", projectId], {
                          ...d,
                          draft: nextDraft,
                        });
                        saveDraft.mutate(nextDraft);
                      }}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                Opsional: Figma, Storybook, atau demo.
              </p>
            )}
          </div>
        ) : null}

        {/* Test Results */}
        {selectedTemplate?.supports.testResults ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <h3 className="text-sm font-medium text-zinc-800">
              Hasil test / validasi
            </h3>
            <textarea
              className="mt-3 min-h-[96px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
              placeholder="Ringkasan hasil test: temuan utama, evidence, keputusan desain..."
              value={draft.testResults ?? ""}
              onChange={(e) => {
                const testResults = e.target.value;
                qc.setQueryData(["project", projectId], (old: ProjectResponse) =>
                  old ? { ...old, draft: { ...old.draft, testResults } } : old,
                );
              }}
              onBlur={() => {
                const d = qc.getQueryData(["project", projectId]) as
                  | ProjectResponse
                  | undefined;
                if (d) saveDraft.mutate(d.draft);
              }}
            />
          </div>
        ) : null}

        {/* Case Studies */}
        <details
          id="ws-studies"
          className="scroll-mt-24 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 animate-fade-in-up"
          style={{ animationDelay: '240ms' }}
          open={(draft.studies ?? []).length > 0}
        >
          <summary className="cursor-pointer text-sm font-medium text-zinc-800">
            Studi kasus di PDF (banyak bab) — opsional
          </summary>
          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                Satu bab default dipakai dari ringkasan utama jika kosong.
              </p>
              <button
                type="button"
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200"
                onClick={() => {
                  const d = qc.getQueryData(["project", projectId]) as
                    | ProjectResponse
                    | undefined;
                  if (!d) return;
                  const ids = d.screenshots.map((s) => s.id);
                  const next = createEmptyCaseStudy(ids);
                  const studies = [...(d.draft.studies ?? []), next];
                  const nextDraft = { ...d.draft, studies };
                  qc.setQueryData(["project", projectId], {
                    ...d,
                    draft: nextDraft,
                  });
                  saveDraft.mutate(nextDraft);
                }}
              >
                + Tambah studi kasus
              </button>
            </div>
            {(draft.studies ?? []).map((study, studyIdx) => (
              <div
                key={study.id}
                className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-white p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700">
                    Bab {studyIdx + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-700 underline"
                    onClick={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (!d) return;
                      const studies = (d.draft.studies ?? []).filter(
                        (_, i) => i !== studyIdx,
                      );
                      const nextDraft = {
                        ...d.draft,
                        studies: studies.length ? studies : undefined,
                      };
                      qc.setQueryData(["project", projectId], {
                        ...d,
                        draft: nextDraft,
                      });
                      saveDraft.mutate(nextDraft);
                    }}
                  >
                    Hapus
                  </button>
                </div>
                <input
                  className="w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                  placeholder="Judul studi kasus"
                  value={study.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    qc.setQueryData(
                      ["project", projectId],
                      (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const studies = [...(old.draft.studies ?? [])];
                        studies[studyIdx] = { ...studies[studyIdx], title };
                        return {
                          ...old,
                          draft: { ...old.draft, studies },
                        };
                      },
                    );
                  }}
                  onBlur={() => {
                    const d = qc.getQueryData(["project", projectId]) as
                      | ProjectResponse
                      | undefined;
                    if (d) saveDraft.mutate(d.draft);
                  }}
                />
                <textarea
                  className="min-h-[60px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                  placeholder="Deskripsi studi kasus…"
                  value={study.summary}
                  onChange={(e) => {
                    const summary = e.target.value;
                    qc.setQueryData(
                      ["project", projectId],
                      (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const studies = [...(old.draft.studies ?? [])];
                        studies[studyIdx] = { ...studies[studyIdx], summary };
                        return {
                          ...old,
                          draft: { ...old.draft, studies },
                        };
                      },
                    );
                  }}
                  onBlur={() => {
                    const d = qc.getQueryData(["project", projectId]) as
                      | ProjectResponse
                      | undefined;
                    if (d) saveDraft.mutate(d.draft);
                  }}
                />
              </div>
            ))}
          </div>
        </details>

        <div className="animate-fade-in-up flex items-center justify-between pt-2" style={{ animationDelay: '300ms' }}>
          <button type="button" onClick={() => setContentStep(1)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 active:scale-[0.98]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Kembali
          </button>
          <button type="button" onClick={() => setContentStep(3)} className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 active:scale-[0.98]">
            Perbaiki AI
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </section>
      )}

      {/* Sub-step 3: Perbaiki AI */}
      {contentStep === 3 && (
      <section className="space-y-5 animate-fade-in-up" key="cs3">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            </span>
            Perbaiki dengan AI
          </h2>
          <p className="text-xs text-zinc-500">Instruksikan AI untuk meningkatkan teks dan edit per layar.</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <h3 className="text-sm font-semibold text-zinc-800">Perbaiki teks dengan AI</h3>
          <p className="mb-3 mt-1 text-xs text-zinc-500">Instruksi singkat (mis. &quot;persingkat&quot;, &quot;nada formal&quot;).</p>
          <textarea
            className="input-field min-h-[72px] resize-y"
            value={regenInstr}
            onChange={(e) => setRegenInstr(e.target.value)}
            placeholder="Instruksi untuk mengedit ringkasan dan poin per layar…"
          />
          <button
            type="button"
            disabled={regenMut.isPending || !regenInstr.trim()}
            onClick={() => regenMut.mutate()}
            className="btn-primary mt-3 !rounded-xl !text-sm"
          >
            {regenMut.isPending ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Memproses…</>
            ) : "✨ Regenerate teks"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <h3 className="text-sm font-semibold text-zinc-800">Per layar</h3>
          <p className="mt-1 text-xs text-zinc-500">Edit langsung atau pakai Regenerate di atas.</p>
          <ScreenDraftsEditor qc={qc} projectId={projectId} project={project!} saveDraft={saveDraft} retryMut={retryMut} />
        </div>

        <div className="animate-fade-in-up flex items-center justify-between pt-2" style={{ animationDelay: '180ms' }}>
          <button type="button" onClick={() => setContentStep(2)} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 active:scale-[0.98]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Kembali
          </button>
          <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98]">
            Lanjut ke Export
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </section>
      )}

      </>
      )}

      {/* ===== STEP 3: Export ===== */}
      {step === 3 && (
      <>
      <section
        className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          Pratinjau
        </h2>
        <div className="max-w-xl rounded-xl border border-zinc-100 bg-zinc-50/80 p-6 shadow-inner">
          <h3 className="text-lg font-bold text-zinc-900">
            {project!.title || "Portfolio project"}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {draft.projectSummary || "—"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {draft.techStack.length > 0 ? draft.techStack.map((t, i) => (
              <span key={i} className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">{t}</span>
            )) : <span className="text-xs text-zinc-400">Belum ada tech stack</span>}
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </span>
          Unduh PDF
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Template PDF</span>
            <select
              className="input-field mt-1 !py-2.5"
              value={pdfTemplate}
              onChange={(e) => setPdfTemplate(e.target.value as "default" | "compact")}
            >
              <option value="default">Default (lebar)</option>
              <option value="compact">Compact (rapat)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => pdfMut.mutate()}
            disabled={pdfMut.isPending || project!.screenshots.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:transform-none"
          >
            {pdfMut.isPending ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Membuat PDF…</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> Unduh PDF</>
            )}
          </button>
        </div>
      </section>
      </>
      )}

      </div>{/* end step content */}

      {/* Step Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={!canGoPrev}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Kembali
        </button>
        <span className="text-xs text-zinc-400 tabular-nums">{step + 1} / {STEPS.length}</span>
        {canGoNext ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 active:scale-[0.98]"
          >
            Lanjut
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        ) : (
          <div />
        )}
      </div>

        </div>{/* End Left Column */}
        
        {/* Right Column - Live Preview */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-7 sticky top-8">
          <LivePreview project={project!} />
        </div>
      </div>{/* End Grid */}

    </div>
  );
}

function LivePreview({ project }: { project: ProjectResponse }) {
  const draft = project.draft;

  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50/50 p-6 shadow-2xl relative flex flex-col h-[calc(100vh-4rem)]">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-64 h-64 text-zinc-900"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"/></svg>
      </div>
      <div className="flex items-center gap-2 mb-6 text-emerald-600 font-semibold text-sm shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Live Preview
      </div>
      
      {/* Scrollable Container */}
      <div className="space-y-6 flex-1 overflow-y-auto pr-3 relative z-10 pb-8 snap-y">
        
        {/* Title & Summary */}
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 snap-start">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
            {project.title || "Tanpa Judul"}
          </h1>
          {project.jobFocus && (
            <div className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {project.jobFocus}
            </div>
          )}
          <p className="text-zinc-600 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
            {draft.projectSummary || "Ringkasan proyek akan muncul di sini saat Anda mengetik..."}
          </p>
          
          {draft.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100 mt-4">
              {draft.techStack.map((tech, i) => (
                <span key={i} className="px-2 cursor-default py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] sm:text-xs font-bold border border-indigo-100/50">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Sections */}
        {(draft.sections ?? []).length > 0 && (
          <div className="space-y-4">
            {(draft.sections ?? []).map((sec) => (
              <div key={sec.id} className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 snap-start">
                <h3 className="text-lg font-bold text-zinc-900 mb-3">{sec.label || "Section Baru"}</h3>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                  {sec.content || "Belum ada konten."}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Screens */}
        {project.screenshots.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100 snap-start">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Layar & Fitur</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {project.screenshots.map((s, idx) => (
                <div key={s.id} className="rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden aspect-[9/16] relative shadow-sm group">
                   <img src={s.previewUrl} alt="" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                   <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-md bg-white/90 shadow text-[10px] font-bold text-zinc-800 backdrop-blur-sm">
                     {idx + 1}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
