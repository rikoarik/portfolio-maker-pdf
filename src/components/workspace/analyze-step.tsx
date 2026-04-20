import Image from "next/image";
import Link from "next/link";
import type { UseMutationResult } from "@tanstack/react-query";
import type { JobResponse, ProjectResponse } from "@/lib/api";

type AnalyzeStepProps = {
  project: ProjectResponse;
  job?: JobResponse;
  analyzing: boolean;
  privacyOk: boolean;
  showPrivacy: boolean;
  analyzeMut: UseMutationResult<{ jobId: string }, unknown, void, unknown>;
  deleteShotMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  setShowPrivacy: (value: boolean) => void;
  setPrivacyOk: (value: boolean) => void;
};

export function AnalyzeStep({
  project,
  job,
  analyzing,
  privacyOk,
  showPrivacy,
  analyzeMut,
  deleteShotMut,
  setShowPrivacy,
  setPrivacyOk,
}: AnalyzeStepProps) {
  return (
    <>
      {showPrivacy ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            className="animate-scale-in max-h-[90vh] max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="text-center text-lg font-bold text-zinc-900">Pengiriman gambar ke AI</h3>
            <p className="mt-3 text-center text-sm leading-relaxed text-zinc-600">
              Gambar bukti akan diproses oleh layanan Google Gemini melalui backend kami. Jangan mengunggah data sensitif, kata sandi, atau informasi pribadi orang lain. Lihat juga halaman{" "}
              <Link href="/privacy" className="font-medium text-indigo-600 hover:underline">Privasi</Link>.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                onClick={() => setShowPrivacy(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary flex-1 !rounded-xl !py-2.5 !text-sm"
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

      <section className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {!privacyOk ? (
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-100"
              >
                🔒 Setujui privasi & analisis AI
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Privasi disetujui
              </span>
            )}
            <button
              type="button"
              disabled={!privacyOk || project.screenshots.length === 0 || analyzing}
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
          {analyzing && job?.progress != null ? (
            <div className="mt-4 progress-bar"><div className="progress-bar-fill" style={{ width: `${job.progress}%` }} /></div>
          ) : null}
          {process.env.NODE_ENV === "development" ? (
            <p className="mt-3 text-xs text-zinc-400">
              Dev: tanpa <code className="rounded bg-zinc-100 px-1 text-zinc-600">GEMINI_API_KEY</code> di <code className="rounded bg-zinc-100 px-1 text-zinc-600">.env</code>, analisis gagal.
            </p>
          ) : null}
        </div>

        {project.screenshots.length > 0 ? (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-3 text-xs font-medium text-zinc-500">
              {project.screenshots.length} screenshot diunggah
            </p>
            <div className="flex gap-2 overflow-x-auto">
              {project.screenshots.map((screenshot, index) => (
                <div key={screenshot.id} className="group/shot relative h-20 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <Image
                    src={screenshot.previewUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="48px"
                    className="object-cover object-top"
                  />
                  <div className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded bg-zinc-900/60 text-[8px] font-bold text-white">
                    {index + 1}
                  </div>
                  <button
                    type="button"
                    disabled={deleteShotMut.isPending}
                    onClick={() => {
                      if (!window.confirm(`Hapus screenshot layar ${index + 1}?`)) {
                        return;
                      }
                      deleteShotMut.mutate(screenshot.id);
                    }}
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded bg-white/95 text-[10px] font-bold text-zinc-600 opacity-0 shadow-sm ring-1 ring-zinc-200/80 hover:bg-red-50 hover:text-red-600 group-hover/shot:opacity-100 disabled:opacity-40"
                    aria-label={`Hapus screenshot ${index + 1}`}
                    title="Hapus"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
