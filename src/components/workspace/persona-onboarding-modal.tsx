"use client";

import type { OnboardingPersonaCard } from "@/lib/template-sections";
import { PORTFOLIO_ONBOARDING_PERSONAS } from "@/lib/template-sections";

type Props = {
  open: boolean;
  onPick: (card: OnboardingPersonaCard) => void;
  onSkip: () => void;
};

export function PersonaOnboardingModal({ open, onPick, onSkip }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-onboard-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="persona-onboard-title"
          className="text-lg font-semibold text-zinc-900"
        >
          Kamu bikin portofolio untuk peran apa?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Ini men-set kerangka case study dan petunjuk isian. Bisa diubah kapan saja.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {PORTFOLIO_ONBOARDING_PERSONAS.map((card) => (
            <li key={card.personaId}>
              <button
                type="button"
                onClick={() => onPick(card)}
                className="flex h-full w-full flex-col rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-left transition hover:border-zinc-400 hover:bg-white"
              >
                <span className="font-medium text-zinc-900">{card.title}</span>
                <span className="mt-1 text-xs text-zinc-600">{card.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-zinc-500 underline hover:text-zinc-800"
          >
            Lewati dulu
          </button>
        </div>
      </div>
    </div>
  );
}
