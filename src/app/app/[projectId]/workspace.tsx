"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  MAX_SCREENSHOT_BYTES,
  MAX_SCREENSHOTS_PER_PROJECT,
} from "@/lib/constants";
import {
  deleteScreenshot,
  downloadPdf,
  getJob,
  getMe,
  getProject,
  generateNarrative,
  generateSectionsFromTemplate,
  patchProject,
  regenerateDraft,
  retryScreenshot,
  startAnalyze,
  uploadScreenshots,
  type ProjectResponse,
} from "@/lib/api";
import { AnalyzeStep } from "@/components/workspace/analyze-step";
import { ContentStep } from "@/components/workspace/content-step";
import { ExportStep } from "@/components/workspace/export-step";
import { LivePreview } from "@/components/workspace/live-preview";
import { PersonaOnboardingModal } from "@/components/workspace/persona-onboarding-modal";
import { UploadStep } from "@/components/workspace/upload-step";
import { type OnboardingPersonaCard } from "@/lib/template-sections";
import {
  formatClientApiError,
  getWorkspaceViewModel,
} from "@/lib/workspace-view-model";
import Link from "next/link";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [editorMode, setEditorMode] = useState<"guided" | "advanced">("guided");
  const [narrativeMode, setNarrativeMode] = useState<"auto" | "manual" | "rewrite">(
    "auto",
  );

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });
  const meQ = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
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
  const narrativeMut = useMutation({
    mutationFn: (mode: "auto" | "rewrite") =>
      generateNarrative(projectId, {
        mode,
        manualInput:
          mode === "rewrite"
            ? {
                problem: projectQ.data?.draft.problemSummary ?? "",
                solution: projectQ.data?.draft.solutionSummary ?? "",
                impact: projectQ.data?.draft.impactSummary ?? "",
              }
            : undefined,
      }),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) =>
        old ? { ...old, draft: data.draft } : old,
      );
      setLocalError(null);
      setSaveHint("Konten ter-generate");
      window.setTimeout(() => setSaveHint(null), 2200);
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

  const deleteShotMut = useMutation({
    mutationFn: (assetId: string) => deleteScreenshot(projectId, assetId),
    onSuccess: (data) => {
      qc.setQueryData(["project", projectId], data);
      qc.invalidateQueries({ queryKey: ["my-projects"] });
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
  const {
    analyzing,
    projectTitle,
    selectedTemplate,
    usage,
    aiCap,
    aiUsed,
    pdfCap,
    pdfUsed,
    usageWarn,
    pdfWarn,
    missingScreenshotsForExport,
    jobFailureMessage,
    checklist,
    dropHint,
    jobPh,
    showPersonaModal,
  } = getWorkspaceViewModel({
    project: project!,
    job,
    user: meQ.data?.user,
    analyzePending: analyzeMut.isPending,
  });

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
    <div className="-mx-4 sm:-mx-6 lg:-mx-6 -mt-6 -mb-16 flex min-h-[calc(100vh-64px)] animate-fade-in flex-col lg:flex-row overflow-hidden bg-white">
      <PersonaOnboardingModal
        open={showPersonaModal}
        onPick={pickPersona}
        onSkip={skipPersona}
      />

      {/* Left Column - Form Steps (Mentok Kiri) */}
      <div className="flex-1 lg:w-7/12 xl:w-7/12 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white overflow-y-auto h-[100vh] lg:h-[calc(100vh-64px)] custom-scrollbar pb-16">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-8 lg:px-12 py-8 lg:py-12 space-y-6">

      {/* Header */}
      <header className="mb-6">
        <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/app" className="flex items-center gap-1 hover:text-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
            Proyek
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-zinc-300"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span className="font-medium text-zinc-700 truncate max-w-[200px]">{projectTitle}</span>
          {saveDraft.isPending || saveHint ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600" aria-live="polite">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              {saveDraft.isPending ? "Menyimpan…" : saveHint}
            </span>
          ) : null}
        </nav>
      </header>

      {/* Stepper */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar">
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
      {jobFailureMessage ? (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p>{jobFailureMessage}</p>
        </div>
      ) : null}
      {usageWarn ? (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5 text-amber-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <div>
            <p className="font-medium">Kuota analisis AI hampir habis.</p>
            <p className="text-xs mt-0.5">
              Terpakai {aiUsed}/{aiCap} untuk periode {usage?.periodLabel ?? usage?.periodKey}.{" "}
              <Link href="/pricing" className="underline font-medium">Lihat paket Pro</Link>.
            </p>
          </div>
        </div>
      ) : null}

      {/* Step Content */}
      <div className="animate-fade-in-up" key={step}>

      {/* ===== STEP 0: Upload ===== */}
      {step === 0 && (
        <UploadStep
          project={project!}
          dropHint={dropHint}
          maxScreenshots={MAX_SCREENSHOTS_PER_PROJECT}
          maxScreenshotMb={Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024)}
          uploadPending={uploadMut.isPending}
          deleteShotMut={deleteShotMut}
          onFiles={onFiles}
        />
      )}

      {/* ===== STEP 1: AI Analysis ===== */}
      {step === 1 && (
        <AnalyzeStep
          project={project!}
          job={job}
          analyzing={analyzing}
          privacyOk={privacyOk}
          showPrivacy={showPrivacy}
          analyzeMut={analyzeMut}
          deleteShotMut={deleteShotMut}
          setShowPrivacy={setShowPrivacy}
          setPrivacyOk={setPrivacyOk}
        />
      )}

      {/* ===== STEP 2: Content ===== */}
      {step === 2 && (
        <ContentStep
          qc={qc}
          project={project!}
          projectId={projectId}
          contentStep={contentStep}
          setContentStep={setContentStep}
          editorMode={editorMode}
          setEditorMode={setEditorMode}
          narrativeMode={narrativeMode}
          setNarrativeMode={setNarrativeMode}
          regenInstr={regenInstr}
          setRegenInstr={setRegenInstr}
          newProtoLabel={newProtoLabel}
          setNewProtoLabel={setNewProtoLabel}
          newProtoUrl={newProtoUrl}
          setNewProtoUrl={setNewProtoUrl}
          jobPlaceholder={jobPh}
          selectedTemplate={selectedTemplate}
          checklist={checklist}
          saveDraft={saveDraft}
          narrativeMut={narrativeMut}
          genSectionsMut={genSectionsMut}
          regenMut={regenMut}
          retryMut={retryMut}
          onGoToStep={setStep}
        />
      )}

      {/* ===== STEP 3: Export ===== */}
      {step === 3 && (
        <ExportStep
          projectTitle={project!.title}
          projectSummary={draft.projectSummary}
          techStack={draft.techStack}
          pdfTemplate={pdfTemplate}
          setPdfTemplate={setPdfTemplate}
          pdfMut={pdfMut}
          missingScreenshotsForExport={missingScreenshotsForExport}
          pdfWarn={pdfWarn}
          pdfUsed={pdfUsed}
          pdfCap={pdfCap}
          usageLabel={usage?.periodLabel ?? usage?.periodKey}
          onGoToUpload={() => setStep(0)}
          onResetToUpload={() => {
            setStep(0);
            setLocalError(null);
          }}
        />
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

        </div>
      </div>{/* End Left Column */}
        
      {/* Right Column - Live Preview (Mentok Kanan) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 bg-zinc-50/50 items-center justify-center p-6 lg:p-10 xl:p-12 lg:h-[calc(100vh-64px)] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl max-h-2xl rounded-full bg-gradient-to-tr from-indigo-100/40 via-sky-50/40 to-emerald-50/40 blur-3xl -z-10" />
        
        <LivePreview project={project!} />
      </div>
    </div>
  );
}

