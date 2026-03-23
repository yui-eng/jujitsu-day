import { MoodOption, FatigueOption, moodOptions, fatigueOptions } from "./types";

interface Props {
  selectedMood: MoodOption | null;
  selectedFatigue: FatigueOption | null;
  setSelectedMood: (v: MoodOption) => void;
  setSelectedFatigue: (v: FatigueOption | null) => void;
}

export default function StepMood({ selectedMood, selectedFatigue, setSelectedMood, setSelectedFatigue }: Props) {
  return (
    <div className="space-y-4">
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-4">🎭 今日の気分は？</h2>
        <div className="grid grid-cols-2 gap-2">
          {moodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedMood(opt.value)}
              className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedMood === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="font-semibold text-sm mt-1">{opt.label}</div>
              <div className="text-xs text-stone-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-1">🌡️ 今日の体調は？</h2>
        <p className="text-xs text-stone-400 mb-4">任意</p>
        <div className="grid grid-cols-2 gap-2">
          {fatigueOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedFatigue(selectedFatigue === opt.value ? null : opt.value)}
              className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedFatigue === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="font-semibold text-sm mt-1">{opt.label}</div>
              <div className="text-xs text-stone-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
