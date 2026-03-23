import { LocationInfo } from "./types";

interface Props {
  location: LocationInfo | null;
  locationLoading: boolean;
  locationError: string | null;
  manualMode: boolean;
  manualInput: string;
  setManualMode: (v: boolean) => void;
  setManualInput: (v: string) => void;
  getLocation: () => void;
  handleManualLocation: () => void;
}

export default function StepLocation({
  location, locationLoading, locationError,
  manualMode, manualInput,
  setManualMode, setManualInput,
  getLocation, handleManualLocation,
}: Props) {
  return (
    <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
      <h2 className="text-base font-bold text-stone-700 mb-4">📍 今いる場所は？</h2>
      {location && !manualMode ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-stone-800">
              {[location.city, location.prefecture].filter(Boolean).join(" ") || "位置情報を取得済み"}
            </p>
            <p className="text-sm text-stone-400 mt-0.5">設定済み ✓</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setManualMode(true); setManualInput([location.city, location.prefecture].filter(Boolean).join(" ")); }}
              className="text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600"
            >
              編集
            </button>
            <button onClick={getLocation} className="text-sm text-stone-600 underline underline-offset-2 hover:text-stone-800">
              GPS更新
            </button>
          </div>
        </div>
      ) : manualMode ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualLocation()}
              placeholder="例：渋谷、大阪市、鎌倉市"
              className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-800 text-sm focus:outline-none focus:border-stone-500 bg-white/80"
              autoFocus
            />
            <button
              onClick={handleManualLocation}
              disabled={locationLoading || !manualInput.trim()}
              className="px-4 py-2.5 bg-stone-700 text-white rounded-xl font-semibold text-sm hover:bg-stone-800 disabled:opacity-50"
            >
              {locationLoading ? "⏳" : "決定"}
            </button>
          </div>
          <button
            onClick={() => { setManualMode(false); if (!location) getLocation(); }}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← GPSで取得する
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="w-full py-3 bg-stone-700 text-white rounded-xl font-semibold hover:bg-stone-800 active:bg-stone-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide"
          >
            {locationLoading ? <><span className="animate-spin">⏳</span> 取得中...</> : <>📍 現在地を自動取得する</>}
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="w-full py-2.5 border border-stone-200 text-stone-500 rounded-xl text-sm font-medium hover:border-stone-400 hover:text-stone-700 transition-colors bg-white/50"
          >
            ✏️ 地名を手動で入力する
          </button>
        </div>
      )}
      {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
    </section>
  );
}
