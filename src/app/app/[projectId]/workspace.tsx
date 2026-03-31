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

  const SECTION_TEMPLATES = [
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
  ] as const;

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
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

  const retryMut = useMutation({
    mutationFn: (assetId: string) => retryScreenshot(projectId, assetId),
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
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">
        Memuat proyek…
      </div>
    );
  }
  if (projectQ.isError) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-red-600">Gagal memuat proyek.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-zinc-600">
          <Link href="/app" className="underline">
            Proyek saya
          </Link>
          <Link href="/" className="underline">
            Beranda
          </Link>
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
  const selectedTemplate =
    SECTION_TEMPLATES.find((t) => t.id === draft.templateId) ?? null;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <nav className="mb-3 text-sm text-zinc-500">
          <Link href="/app" className="hover:text-zinc-800">
            Proyek saya
          </Link>
          <span className="mx-2 text-zinc-300">/</span>
          <span className="text-zinc-700">{projectTitle}</span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {projectTitle}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Unggah screenshot aplikasi, jalankan analisis AI, lalu unduh PDF.
        </p>
      </header>

      {localError ? (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {localError}
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Screenshot
        </h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 transition hover:border-zinc-400">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            disabled={uploadMut.isPending}
          />
          <span className="text-sm text-zinc-600">
            {uploadMut.isPending
              ? "Mengunggah…"
              : "Seret atau klik untuk memilih gambar (PNG, JPG, WebP)"}
          </span>
          <span className="mt-1 text-xs text-zinc-400">
            Maks {MAX_SCREENSHOTS_PER_PROJECT} file,{" "}
            {Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024)} MB per file
          </span>
        </label>

        {project!.screenshots.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {project!.screenshots.map((s) => (
              <li
                key={s.id}
                className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.previewUrl}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="truncate px-2 py-1 text-xs text-zinc-500">
                  {s.analysisStatus}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          {!privacyOk ? (
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800"
            >
              Setujui privasi & analisis AI
            </button>
          ) : (
            <span className="text-sm text-green-700">Privasi disetujui</span>
          )}
          <button
            type="button"
            disabled={
              !privacyOk || project!.screenshots.length === 0 || analyzing
            }
            onClick={() => analyzeMut.mutate()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            title={
              !privacyOk
                ? "Setujui privasi terlebih dahulu"
                : "Jalankan analisis"
            }
          >
            {analyzing
              ? `Menganalisis… ${job?.progress ?? 0}%`
              : "Analisis dengan AI"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Tanpa API key Gemini di server, tombol akan gagal — set{" "}
          <code className="rounded bg-zinc-100 px-1">GEMINI_API_KEY</code> di{" "}
          <code className="rounded bg-zinc-100 px-1">.env</code>.
        </p>
      </section>

      {showPrivacy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-zinc-900">
              Pengiriman gambar ke AI
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Screenshot akan diproses oleh layanan Google Gemini melalui backend
              kami. Jangan mengunggah data sensitif, kata sandi, atau informasi
              pribadi orang lain. Lihat juga halaman{" "}
              <Link href="/privacy" className="underline">
                Privasi
              </Link>
              .
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm text-zinc-600"
                onClick={() => setShowPrivacy(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
                onClick={() => {
                  setPrivacyOk(true);
                  setShowPrivacy(false);
                }}
              >
                Saya mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mb-10 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Ringkasan proyek
        </h2>
        <label className="block">
          <span className="text-xs text-zinc-500">Judul</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-zinc-500">
              Fokus pekerjaan / lamaran (untuk AI & PDF)
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
              placeholder="Mis. Product designer, Backend engineer"
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
            <span className="text-xs text-zinc-500">Industri / domain</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
              placeholder="Mis. Fintech, E-commerce"
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
        <label className="block">
          <span className="text-xs text-zinc-500">
            Profil pembaca (ringkas, untuk PDF)
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-zinc-500">Template sections</span>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-800">Catatan</p>
            <p className="mt-1">
              Pilih template untuk menyusun bagian case study. Kamu tetap bisa
              tambah/hapus/urut ulang section setelahnya.
            </p>
          </div>
        </div>
        <label className="block">
          <span className="text-xs text-zinc-500">Ringkasan (boleh diedit)</span>
          <textarea
            className="mt-1 min-h-[100px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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
        <label className="block">
          <span className="text-xs text-zinc-500">
            Tech stack (pisahkan koma)
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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
        <label className="block">
          <span className="text-xs text-zinc-500">
            Sorotan (satu baris = satu poin, untuk PDF)
          </span>
          <textarea
            className="mt-1 min-h-[72px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
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
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                  ? "Buat sections dari template"
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
                      : "Generate sections dengan AI"
                  }
                >
                  {genSectionsMut.isPending ? "Generating…" : "Generate AI"}
                </button>
              ) : null}
            </div>
          </div>
          {(draft.sections ?? []).length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Sections belum ada. Pilih template lalu klik “Buat sections dari template”, atau tambah section manual.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {(draft.sections ?? []).map((sec, sidx) => (
                <li
                  key={sec.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs text-zinc-500">Judul section</label>
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
                      qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const sections = [...(old.draft.sections ?? [])];
                        sections[sidx] = { ...sections[sidx], label };
                        return {
                          ...old,
                          draft: { ...old.draft, sections },
                        };
                      });
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
                      qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const sections = [...(old.draft.sections ?? [])];
                        sections[sidx] = { ...sections[sidx], content };
                        return {
                          ...old,
                          draft: { ...old.draft, sections },
                        };
                      });
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

        {selectedTemplate?.supports.prototypeLinks ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Link prototype
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
                placeholder="Label (mis. Figma, Framer)"
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
                      <p className="text-sm font-medium text-zinc-900">{l.label}</p>
                      <p className="truncate font-mono text-xs text-zinc-600">{l.url}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-700 underline"
                      onClick={() => {
                        const d = qc.getQueryData(["project", projectId]) as
                          | ProjectResponse
                          | undefined;
                        if (!d) return;
                        const prototypeLinks = (d.draft.prototypeLinks ?? []).filter(
                          (_, i) => i !== idx,
                        );
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
                Tambahkan link untuk prototype (opsional).
              </p>
            )}
          </div>
        ) : null}

        {selectedTemplate?.supports.testResults ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
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
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Studi kasus di PDF (banyak ringkasan)
            </h3>
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
                const draft = { ...d.draft, studies };
                qc.setQueryData(["project", projectId], { ...d, draft });
                saveDraft.mutate(draft);
              }}
            >
              + Tambah bab
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Tiap bab punya judul, ringkasan, dan screenshot (pilih ID dari daftar
            unggahan atau biarkan semua).
          </p>
          {(draft.studies ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              Satu bab default dipakai dari ringkasan utama. Tambah bab untuk
              beberapa proyek dalam satu PDF.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {(draft.studies ?? []).map((st, idx) => (
                <li
                  key={st.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <label className="block text-xs text-zinc-500">Judul bab</label>
                  <input
                    className="mt-1 w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                    value={st.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const studies = [...(old.draft.studies ?? [])];
                        studies[idx] = { ...studies[idx], title };
                        return {
                          ...old,
                          draft: { ...old.draft, studies },
                        };
                      });
                    }}
                    onBlur={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (d) saveDraft.mutate(d.draft);
                    }}
                  />
                  <label className="mt-2 block text-xs text-zinc-500">
                    Ringkasan bab
                  </label>
                  <textarea
                    className="mt-1 min-h-[60px] w-full rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900 placeholder:text-zinc-400"
                    value={st.summary}
                    onChange={(e) => {
                      const summary = e.target.value;
                      qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) => {
                        if (!old) return old;
                        const studies = [...(old.draft.studies ?? [])];
                        studies[idx] = { ...studies[idx], summary };
                        return {
                          ...old,
                          draft: { ...old.draft, studies },
                        };
                      });
                    }}
                    onBlur={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (d) saveDraft.mutate(d.draft);
                    }}
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Screenshot dalam bab ini:
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {project!.screenshots.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={st.screenAssetIds.includes(s.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            qc.setQueryData(["project", projectId], (old: ProjectResponse | undefined) => {
                              if (!old) return old;
                              const studies = [...(old.draft.studies ?? [])];
                              const cur = studies[idx].screenAssetIds;
                              const next = checked
                                ? [...cur, s.id]
                                : cur.filter((id) => id !== s.id);
                              studies[idx] = {
                                ...studies[idx],
                                screenAssetIds: [...new Set(next)],
                              };
                              return {
                                ...old,
                                draft: { ...old.draft, studies },
                              };
                            });
                          }}
                        />
                        {s.id.slice(0, 8)}…
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 text-xs font-medium text-red-700 underline"
                    onClick={() => {
                      const d = qc.getQueryData(["project", projectId]) as
                        | ProjectResponse
                        | undefined;
                      if (!d) return;
                      const studies = (d.draft.studies ?? []).filter(
                        (_, i) => i !== idx,
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
                    Hapus bab ini
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Pratinjau (struktur seperti PDF)
        </h2>
        <div className="mt-4 max-w-xl border border-zinc-100 bg-zinc-50/80 p-6">
          <h3 className="text-lg font-semibold text-zinc-900">
            {project!.title || "Portfolio project"}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700">
            {draft.projectSummary || "—"}
          </p>
          <p className="mt-4 text-xs font-medium uppercase text-zinc-400">
            Tech stack
          </p>
          <p className="text-sm text-zinc-800">
            {draft.techStack.length ? draft.techStack.join(", ") : "—"}
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Perbaiki teks dengan AI
        </h2>
        <p className="mb-2 text-xs text-zinc-500">
          Instruksi singkat (mis. &quot;persingkat&quot;, &quot;tona formal&quot;).
        </p>
        <textarea
          className="min-h-[72px] w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
          value={regenInstr}
          onChange={(e) => setRegenInstr(e.target.value)}
          placeholder="Instruksi untuk mengedit ringkasan dan poin per layar…"
        />
        <button
          type="button"
          disabled={regenMut.isPending || !regenInstr.trim()}
          onClick={() => regenMut.mutate()}
          className="mt-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {regenMut.isPending ? "Memproses…" : "Regenerate teks"}
        </button>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Per layar
        </h2>
        <div className="space-y-6">
          {draft.screens.map((sc) => {
            const shot = project!.screenshots.find((x) => x.id === sc.assetId);
            return (
              <div
                key={sc.assetId}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-500">{sc.title}</p>
                  {shot?.analysisStatus === "failed" ? (
                    <button
                      type="button"
                      disabled={retryMut.isPending}
                      onClick={() => retryMut.mutate(shot.id)}
                      className="text-xs text-indigo-600 underline"
                    >
                      Coba analisis lagi
                    </button>
                  ) : null}
                </div>
                <ul className="mt-2 list-inside list-disc text-sm text-zinc-700">
                  {sc.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                {sc.notes ? (
                  <p className="mt-2 text-sm text-zinc-600">{sc.notes}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="block">
          <span className="text-xs text-zinc-500">Template PDF</span>
          <select
            className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
            value={pdfTemplate}
            onChange={(e) =>
              setPdfTemplate(e.target.value as "default" | "compact")
            }
          >
            <option value="default">Default (lebar)</option>
            <option value="compact">Compact (rapat)</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => pdfMut.mutate()}
          disabled={pdfMut.isPending || project!.screenshots.length === 0}
          className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pdfMut.isPending ? "Membuat PDF…" : "Unduh PDF"}
        </button>
      </section>
    </div>
  );
}
