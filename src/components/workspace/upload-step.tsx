import Image from "next/image";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ProjectResponse } from "@/lib/api";

type UploadStepProps = {
  project: ProjectResponse;
  dropHint: string;
  maxScreenshots: number;
  maxScreenshotMb: number;
  uploadPending: boolean;
  deleteShotMut: UseMutationResult<ProjectResponse, unknown, string, unknown>;
  onFiles: (files: FileList | null) => void;
};

export function UploadStep({
  project,
  dropHint,
  maxScreenshots,
  maxScreenshotMb,
  uploadPending,
  deleteShotMut,
  onFiles,
}: UploadStepProps) {
  return (
    <section className="space-y-6">
      <label className="upload-zone flex cursor-pointer flex-col items-center justify-center text-center">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
          disabled={uploadPending}
        />
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            {uploadPending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" /></svg>
            )}
          </div>
          <span className="text-sm font-medium text-zinc-700">
            {uploadPending ? "Mengunggah…" : dropHint}
          </span>
          <span className="mt-1 text-xs text-zinc-400">
            Maks {maxScreenshots} file, {maxScreenshotMb} MB per file
          </span>
        </div>
      </label>

      {project.screenshots.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {project.screenshots.map((screenshot, index) => (
            <li
              key={screenshot.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-100">
                <Image
                  src={screenshot.previewUrl}
                  alt={`Layar ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover object-top transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900/70 text-[10px] font-bold text-white backdrop-blur-sm">
                  {index + 1}
                </div>
                <button
                  type="button"
                  disabled={deleteShotMut.isPending}
                  onClick={() => {
                    if (!window.confirm(`Hapus screenshot layar ${index + 1} dari proyek ini?`)) {
                      return;
                    }
                    deleteShotMut.mutate(screenshot.id);
                  }}
                  className="absolute right-2 top-2 rounded-md bg-white/95 p-1.5 text-zinc-500 opacity-0 shadow-sm ring-1 ring-zinc-200/80 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                  aria-label={`Hapus screenshot ${index + 1}`}
                  title="Hapus screenshot"
                >
                  {deleteShotMut.isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-xs font-medium text-zinc-600">Layar {index + 1}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${screenshot.analysisStatus === "ok" ? "bg-emerald-50 text-emerald-700" : screenshot.analysisStatus === "failed" ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-500"}`}>
                  {screenshot.analysisStatus}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
