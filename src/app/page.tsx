"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TimeOption = "2h" | "halfday" | "allday";
type BudgetOption = "free" | "low" | "medium" | "high";
type MoodOption =
  | "active"
  | "relaxed"
  | "social"
  | "creative"
  | "nature"
  | "foodie";

interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  prefecture: string;
}

const timeOptions: { value: TimeOption; label: string; desc: string; icon: string }[] = [
  { value: "2h", label: "2時間", desc: "ちょっと外出", icon: "⚡" },
  { value: "halfday", label: "半日", desc: "3〜5時間", icon: "🌤️" },
  { value: "allday", label: "丸1日", desc: "6時間以上", icon: "🌟" },
];

const budgetOptions: { value: BudgetOption; label: string; desc: string }[] = [
  { value: "free", label: "無料", desc: "0円でOK" },
  { value: "low", label: "〜¥1,000", desc: "ちょっと出費" },
  { value: "medium", label: "〜¥5,000", desc: "まあまあ使う" },
  { value: "high", label: "¥5,000〜", desc: "せっかくだから" },
];

const moodOptions: {
  value: MoodOption;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { value: "active", label: "アクティブ", emoji: "🏃", desc: "体を動かしたい" },
  { value: "relaxed", label: "のんびり", emoji: "😌", desc: "ゆったり過ごしたい" },
  { value: "social", label: "わいわい", emoji: "🎉", desc: "誰かと楽しみたい" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨", desc: "何か作りたい" },
  { value: "nature", label: "自然を感じたい", emoji: "🌿", desc: "アウトドア気分" },
  { value: "foodie", label: "グルメ", emoji: "🍜", desc: "美食を楽しみたい" },
];

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`,
            { headers: { "User-Agent": "JujitsuDayApp/1.0" } }
          );
          const data = await res.json();
          const address = data.address || {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            address.suburb ||
            "";
          const prefecture = address.state || address.province || "";
          setLocation({ lat: latitude, lng: longitude, city, prefecture });
        } catch {
          setLocation({ lat: latitude, lng: longitude, city: "", prefecture: "" });
        }
        setLocationLoading(false);
      },
      () => {
        setLocationError(
          "位置情報の取得に失敗しました。ブラウザの設定で許可してください。"
        );
        setLocationLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const handleManualLocation = async () => {
    if (!manualInput.trim()) return;
    setLocationLoading(true);
    setLocationError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualInput)}&format=json&accept-language=ja&limit=1&countrycodes=jp`,
        { headers: { "User-Agent": "JujitsuDayApp/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const nameParts = (result.display_name as string).split("、");
        const city = nameParts[0] || manualInput;
        const prefecture = nameParts[1] || "";
        setLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          city,
          prefecture,
        });
        setManualMode(false);
      } else {
        // Use input as-is with Tokyo coordinates as fallback
        setLocation({ lat: 35.6762, lng: 139.6503, city: manualInput, prefecture: "" });
        setManualMode(false);
      }
    } catch {
      setLocation({ lat: 35.6762, lng: 139.6503, city: manualInput, prefecture: "" });
      setManualMode(false);
    }
    setLocationLoading(false);
  };

  const handleSubmit = () => {
    if (!location || !selectedTime || !selectedBudget || !selectedMood) return;
    setIsSubmitting(true);

    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      city: location.city,
      prefecture: location.prefecture,
      time: selectedTime,
      budget: selectedBudget,
      mood: selectedMood,
    });

    router.push(`/results?${params.toString()}`);
  };

  const isFormComplete =
    location && selectedTime && selectedBudget && selectedMood;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-lg mx-auto px-4 py-8 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-4xl font-bold text-amber-800 tracking-tight">
            充実DAY
          </h1>
          <p className="text-amber-600 mt-2 text-base">
            暇な1日をもっと楽しく過ごそう
          </p>
        </div>

        {/* Step 1: Location */}
        <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-amber-100">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">1</span>
            現在地を教えてください
          </h2>
          {location && !manualMode ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  📍 {[location.city, location.prefecture].filter(Boolean).join(" ") || "位置情報を取得済み"}
                </p>
                <p className="text-sm text-gray-500">設定済み</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setManualMode(true); setManualInput([location.city, location.prefecture].filter(Boolean).join(" ")); }}
                  className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
                >
                  編集
                </button>
                <button
                  onClick={getLocation}
                  className="text-sm text-amber-600 underline underline-offset-2 hover:text-amber-700"
                >
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
                  className="flex-1 border-2 border-amber-300 rounded-xl px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <button
                  onClick={handleManualLocation}
                  disabled={locationLoading || !manualInput.trim()}
                  className="px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 disabled:opacity-50"
                >
                  {locationLoading ? "⏳" : "決定"}
                </button>
              </div>
              <button
                onClick={() => { setManualMode(false); if (!location) getLocation(); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← GPSで取得する
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={getLocation}
                disabled={locationLoading}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {locationLoading ? (
                  <><span className="animate-spin">⏳</span> 取得中...</>
                ) : (
                  <>📍 現在地を自動取得する</>
                )}
              </button>
              <button
                onClick={() => setManualMode(true)}
                className="w-full py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:border-amber-300 hover:text-amber-700 transition-colors"
              >
                ✏️ 地名を手動で入力する
              </button>
            </div>
          )}
          {locationError && (
            <p className="text-red-500 text-sm mt-2">{locationError}</p>
          )}
        </section>

        {/* Step 2: Time */}
        <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-amber-100">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">2</span>
            使える時間は？
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedTime(opt.value)}
                className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                  selectedTime === opt.value
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="text-xl mb-1">{opt.icon}</div>
                <div className="font-bold text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Budget */}
        <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-amber-100">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">3</span>
            今日の予算は？
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {budgetOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedBudget(opt.value)}
                className={`py-3 px-4 rounded-xl border-2 transition-all text-left ${
                  selectedBudget === opt.value
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="font-bold">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 4: Mood */}
        <section className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-amber-100">
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="bg-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">4</span>
            今日の気分は？
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {moodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedMood(opt.value)}
                className={`py-3 px-4 rounded-xl border-2 transition-all text-left ${
                  selectedMood === opt.value
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="text-2xl">{opt.emoji}</div>
                <div className="font-bold text-sm mt-1">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isFormComplete || isSubmitting}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            isFormComplete
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 active:scale-[0.98]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "✨ プランを考え中..." : "今日の充実プランを見る →"}
        </button>

        {!isFormComplete && (
          <p className="text-center text-sm text-gray-400 mt-3">
            すべての項目を入力してください
          </p>
        )}
      </div>
    </main>
  );
}
