import Link from "next/link";
import type { UseMutationResult } from "@tanstack/react-query";

type ExportStepProps = {
  projectTitle: string;
  projectSummary: string;
  techStack: string[];
  pdfTemplate: "default" | "compact";
  setPdfTemplate: (value: "default" | "compact") => void;
  pdfMut: UseMutationResult<Blob, unknown, void, unknown>;
  missingScreenshotsForExport: boolean;
  pdfWarn: boolean;
  pdfUsed: number;
  pdfCap: number;
  usageLabel?: string;
  onGoToUpload: () => void;
  onResetToUpload: () => void;
};

export function ExportStep({
  projectTitle,
  projectSummary,
  techStack,
  pdfTemplate,
  setPdfTemplate,
  pdfMut,
  missingScreenshotsForExport,
  pdfWarn,
  pdfUsed,
  pdfCap,
  usageLabel,
  onGoToUpload,
  onResetToUpload,
}: ExportStepProps) {
  return (
    <>
      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          Pratinjau
        </h2>
        <div className="w-full rounded-xl border border-zinc-100 bg-zinc-50/80 p-6 shadow-inner">
          <h3 className="text-lg font-bold text-zinc-900">{projectTitle || "Portfolio project"}</h3>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">{projectSummary || "—"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {techStack.length > 0 ? (
              techStack.map((tech, index) => (
                <span key={index} className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-400">Belum ada tech stack</span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </span>
          Unduh PDF
        </h2>
        <div className="mb-4 rounded-xl border border-emerald-200/70 bg-white/70 px-4 py-3 text-xs text-zinc-700">
          <p>
            Kuota PDF periode ini: <span className="font-semibold">{pdfUsed}/{pdfCap || "-"}</span>
            {usageLabel ? ` · ${usageLabel}` : ""}
          </p>
          {pdfWarn ? (
            <p className="mt-1 text-amber-700">
              Kuota PDF hampir habis. Simpan export penting lebih dulu atau <Link href="/pricing" className="font-medium underline">upgrade paket</Link>.
            </p>
          ) : null}
        </div>
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
            disabled={pdfMut.isPending || missingScreenshotsForExport}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:hover:transform-none"
          >
            {pdfMut.isPending ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Membuat PDF…</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> Unduh PDF</>
            )}
          </button>
        </div>
        {missingScreenshotsForExport ? (
          <p className="mt-3 text-xs text-zinc-600">
            Export belum bisa dilakukan karena belum ada screenshot. Kembali ke langkah{" "}
            <button type="button" onClick={onGoToUpload} className="font-medium text-indigo-700 underline">
              Upload
            </button>{" "}
            lalu unggah minimal 1 layar.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <Link href="/pricing" className="font-medium text-indigo-700 underline">
            Lihat paket & kuota
          </Link>
          <Link href="/help" className="font-medium text-zinc-700 underline">
            Butuh bantuan export?
          </Link>
          <button type="button" onClick={onResetToUpload} className="font-medium text-zinc-700 underline">
            Upload tambahan screenshot
          </button>
        </div>
      </section>
    </>
  );
}
