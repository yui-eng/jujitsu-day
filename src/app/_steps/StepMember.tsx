import { CompanionOption, TravelRangeOption, companionOptions, travelRangeOptions } from "./types";

interface Props {
  selectedCompanion: CompanionOption | null;
  selectedTravelRange: TravelRangeOption | null;
  setSelectedCompanion: (v: CompanionOption | null) => void;
  setSelectedTravelRange: (v: TravelRangeOption | null) => void;
}

export default function StepMember({ selectedCompanion, selectedTravelRange, setSelectedCompanion, setSelectedTravelRange }: Props) {
  return (
    <div className="space-y-4">
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-1">👥 誰と行く？</h2>
        <p className="text-xs text-stone-400 mb-4">任意 — スキップしてもOK</p>
        <div className="grid grid-cols-4 gap-2">
          {companionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedCompanion(selectedCompanion === opt.value ? null : opt.value)}
              className={`py-3 px-1 rounded-xl border transition-all text-center ${selectedCompanion === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="text-xl mb-1">{opt.emoji}</div>
              <div className="font-semibold text-[11px] leading-tight">{opt.label}</div>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-1">🗺️ どこまで行ける？</h2>
        <p className="text-xs text-stone-400 mb-4">任意 — スキップしてもOK</p>
        <div className="grid grid-cols-4 gap-2">
          {travelRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedTravelRange(selectedTravelRange === opt.value ? null : opt.value)}
              className={`py-3 px-1 rounded-xl border transition-all text-center ${selectedTravelRange === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="text-xl mb-1">{opt.emoji}</div>
              <div className="font-semibold text-[11px] leading-tight">{opt.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
