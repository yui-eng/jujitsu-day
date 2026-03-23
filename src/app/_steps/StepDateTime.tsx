interface Props {
  selectedDate: string;
  selectedStartTime: string;
  setSelectedDate: (v: string) => void;
  setSelectedStartTime: (v: string) => void;
}

export default function StepDateTime({ selectedDate, selectedStartTime, setSelectedDate, setSelectedStartTime }: Props) {
  const setNow = () => {
    const now = new Date();
    setSelectedDate(now.toISOString().split("T")[0]);
    setSelectedStartTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  };

  return (
    <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
      <h2 className="text-base font-bold text-stone-700 mb-4">🗓️ いつ出かける？</h2>
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-700 text-sm focus:outline-none focus:border-stone-500 bg-white/80"
        />
        <input
          type="time"
          value={selectedStartTime}
          onChange={(e) => setSelectedStartTime(e.target.value)}
          className="w-28 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-700 text-sm focus:outline-none focus:border-stone-500 bg-white/80"
        />
        <button
          onClick={setNow}
          className="flex-shrink-0 px-3 py-2.5 bg-stone-700 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap"
        >
          いまから！
        </button>
      </div>
    </section>
  );
}
