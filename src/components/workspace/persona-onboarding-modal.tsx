"use client";

import type { OnboardingPersonaCard } from "@/lib/template-sections";
import { PORTFOLIO_ONBOARDING_PERSONAS } from "@/lib/template-sections";

const PERSONA_EMOJIS: Record<string, string> = {
  "dev-frontend": "💻",
  "dev-backend": "⚙️",
  "dev-fullstack": "🚀",
  "dev-mobile": "📱",
  "designer-ui": "🎨",
  "designer-ux": "🧠",
  "designer-product": "✨",
  "data-analyst": "📊",
  "product-manager": "📋",
  "devops": "🔧",
};

type Props = {
  open: boolean;
  onPick: (card: OnboardingPersonaCard) => void;
  onSkip: () => void;
};

export function PersonaOnboardingModal({ open, onPick, onSkip }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-onboard-title"
        className="animate-scale-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl shadow-lg shadow-indigo-500/20">
            🎯
          </div>
          <h2
            id="persona-onboard-title"
            className="text-xl font-bold text-zinc-900"
          >
            Kamu bikin portofolio untuk peran apa?
          </h2>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Ini men-set kerangka case study dan petunjuk isian. Bisa diubah kapan saja.
          </p>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PORTFOLIO_ONBOARDING_PERSONAS.map((card) => (
            <li key={card.personaId}>
              <button
                type="button"
                onClick={() => onPick(card)}
                className="flex h-full w-full items-start gap-3 rounded-xl border-2 border-zinc-100 bg-zinc-50/50 p-4 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-2xl mt-0.5 shrink-0">
                  {PERSONA_EMOJIS[card.personaId] || "📄"}
                </span>
                <div>
                  <span className="font-semibold text-zinc-900 text-sm">{card.title}</span>
                  <span className="mt-1 block text-xs text-zinc-500 leading-relaxed">{card.blurb}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-center border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-all"
          >
            Lewati dulu
          </button>
        </div>
      </div>
    </div>
  );
}
