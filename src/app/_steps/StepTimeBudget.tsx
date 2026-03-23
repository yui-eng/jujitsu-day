import { TimeOption, BudgetOption, timeOptions, budgetOptions } from "./types";

interface Props {
  selectedTime: TimeOption | null;
  selectedBudget: BudgetOption | null;
  setSelectedTime: (v: TimeOption) => void;
  setSelectedBudget: (v: BudgetOption) => void;
}

export default function StepTimeBudget({ selectedTime, selectedBudget, setSelectedTime, setSelectedBudget }: Props) {
  return (
    <div className="space-y-4">
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-4">⏱️ 使える時間は？</h2>
        <div className="grid grid-cols-3 gap-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedTime(opt.value)}
              className={`py-3 px-2 rounded-xl border transition-all text-center ${selectedTime === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="text-xl mb-1">{opt.icon}</div>
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs text-stone-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
        <h2 className="text-base font-bold text-stone-700 mb-4">💰 今日の予算は？</h2>
        <div className="grid grid-cols-2 gap-2">
          {budgetOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedBudget(opt.value)}
              className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedBudget === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className="text-xs text-stone-400 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
