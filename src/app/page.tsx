"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TimeOption = "2h" | "halfday" | "allday";
type BudgetOption = "free" | "low" | "medium" | "high";
type FatigueOption = "energetic" | "normal" | "tired" | "exhausted";
type MoodOption =
  | "active"
  | "relaxed"
  | "social"
  | "creative"
  | "nature"
  | "foodie";

type CompanionOption = "solo" | "friends" | "couple" | "family";
type TravelRangeOption = "walk" | "30min" | "1hour" | "anywhere";

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

const fatigueOptions: { value: FatigueOption; label: string; emoji: string; desc: string }[] = [
  { value: "energetic", label: "元気いっぱい", emoji: "💪", desc: "なんでもできる！" },
  { value: "normal", label: "普通", emoji: "😊", desc: "まあまあ元気" },
  { value: "tired", label: "ちょっと疲れ", emoji: "😮‍💨", desc: "あまり無理したくない" },
  { value: "exhausted", label: "かなり疲れ", emoji: "😴", desc: "ゆっくりしたい" },
];

const moodOptions: { value: MoodOption; label: string; emoji: string; desc: string }[] = [
  { value: "active", label: "アクティブ", emoji: "🏃", desc: "体を動かしたい" },
  { value: "relaxed", label: "のんびり", emoji: "😌", desc: "ゆったり過ごしたい" },
  { value: "social", label: "わいわい", emoji: "🎉", desc: "誰かと楽しみたい" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨", desc: "何か作りたい" },
  { value: "nature", label: "自然を感じたい", emoji: "🌿", desc: "アウトドア気分" },
  { value: "foodie", label: "グルメ", emoji: "🍜", desc: "美食を楽しみたい" },
];

const companionOptions: { value: CompanionOption; label: string; emoji: string; desc: string }[] = [
  { value: "solo", label: "ひとり", emoji: "🧍", desc: "自由気まま" },
  { value: "friends", label: "友達と", emoji: "👯", desc: "みんなで楽しく" },
  { value: "couple", label: "恋人と", emoji: "💑", desc: "ふたりで" },
  { value: "family", label: "家族と", emoji: "👨‍👩‍👦", desc: "みんな一緒に" },
];

const travelRangeOptions: { value: TravelRangeOption; label: string; emoji: string; desc: string }[] = [
  { value: "walk", label: "徒歩圏", emoji: "🚶", desc: "近所を散策" },
  { value: "30min", label: "30分以内", emoji: "🚌", desc: "電車・バスで" },
  { value: "1hour", label: "1時間以内", emoji: "🚃", desc: "少し足を伸ばして" },
  { value: "anywhere", label: "どこでも", emoji: "✈️", desc: "遠出もOK" },
];

const TOTAL_STEPS = 5;

const stepTitles = ["現在地", "日付・時間", "メンバー", "時間・予算", "気分・体調"];

export default function HomePage() {
  const router = useRouter();

  // Form state
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [selectedFatigue, setSelectedFatigue] = useState<FatigueOption | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionOption | null>(null);
  const [selectedTravelRange, setSelectedTravelRange] = useState<TravelRangeOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);

  // Step wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");

  const canGoNext = [
    !!location,                              // step 0: 現在地
    true,                                    // step 1: 日付（デフォルトあり）
    true,                                    // step 2: 任意
    !!selectedTime && !!selectedBudget,      // step 3: 時間＋予算
    !!selectedMood,                          // step 4: 気分
  ];

  const animateToStep = (next: number, dir: "forward" | "back") => {
    setSlideDir(dir);
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(next);
      setVisible(true);
    }, 220);
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) animateToStep(currentStep + 1, "forward");
  };

  const goBack = () => {
    if (currentStep > 0) animateToStep(currentStep - 1, "back");
  };

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
          const city = address.city || address.town || address.village || address.county || address.suburb || "";
          const prefecture = address.state || address.province || "";
          setLocation({ lat: latitude, lng: longitude, city, prefecture });
        } catch {
          setLocation({ lat: latitude, lng: longitude, city: "", prefecture: "" });
        }
        setLocationLoading(false);
      },
      () => {
        setLocationError("位置情報の取得に失敗しました。ブラウザの設定で許可してください。");
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
        setLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon), city: nameParts[0] || manualInput, prefecture: nameParts[1] || "" });
        setManualMode(false);
      } else {
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
      date: selectedDate,
      startTime: selectedStartTime,
      ...(selectedCompanion && { companion: selectedCompanion }),
      ...(selectedTravelRange && { travelRange: selectedTravelRange }),
      ...(selectedFatigue && { fatigue: selectedFatigue }),
    });
    router.push(`/results?${params.toString()}`);
  };

  const handleQuickRecommend = () => {
    setQuickLoading(true);
    const hour = new Date().getHours();
    const autoTime: TimeOption = hour >= 10 && hour < 14 ? "2h" : hour >= 14 && hour < 19 ? "halfday" : hour >= 19 ? "2h" : "halfday";
    const autoMood: MoodOption = hour >= 6 && hour < 10 ? "active" : hour >= 10 && hour < 14 ? "foodie" : hour >= 14 && hour < 18 ? "relaxed" : "social";
    const today = new Date().toISOString().split("T")[0];
    if (!navigator.geolocation) {
      router.push(`/results?${new URLSearchParams({ lat: "35.6762", lng: "139.6503", city: "東京", prefecture: "東京都", time: autoTime, budget: "low", mood: autoMood, date: today })}`);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`, { headers: { "User-Agent": "JujitsuDayApp/1.0" } });
          const data = await res.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.county || address.suburb || "";
          const prefecture = address.state || address.province || "";
          router.push(`/results?${new URLSearchParams({ lat: latitude.toString(), lng: longitude.toString(), city, prefecture, time: autoTime, budget: "low", mood: autoMood, date: today })}`);
        } catch {
          router.push(`/results?${new URLSearchParams({ lat: latitude.toString(), lng: longitude.toString(), city: "", prefecture: "", time: autoTime, budget: "low", mood: autoMood, date: today })}`);
        }
      },
      () => {
        router.push(`/results?${new URLSearchParams({ lat: "35.6762", lng: "139.6503", city: "東京", prefecture: "東京都", time: autoTime, budget: "low", mood: autoMood, date: today })}`);
        setQuickLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Auto-advance step 0 when location is obtained
  useEffect(() => {
    if (location && currentStep === 0) {
      setTimeout(() => animateToStep(1, "forward"), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const slideStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible
      ? "translateX(0px)"
      : slideDir === "forward"
      ? "translateX(24px)"
      : "translateX(-24px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-10 pb-12">

        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-7xl text-stone-800 leading-none"
            style={{ fontFamily: "var(--font-dancing)", textShadow: "0 2px 8px rgba(255,255,255,0.6)" }}
          >
            Joie
          </h1>
          <p className="text-stone-600 mt-1 text-sm tracking-[0.3em]" style={{ textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>
            ジョワ
          </p>
          <p className="text-stone-500 mt-2 text-[10px] tracking-[0.3em] uppercase" style={{ textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>
            あなただけの一日を
          </p>
        </div>

        {/* Quick Recommend */}
        <button
          onClick={handleQuickRecommend}
          disabled={quickLoading}
          className="w-full mb-6 py-4 rounded-2xl font-semibold text-sm tracking-widest bg-stone-800 text-white hover:bg-stone-900 active:scale-[0.98] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {quickLoading ? <><span className="animate-spin">⏳</span> 現在地を取得中...</> : <>✨ ワンタップで今日のおすすめを見る</>}
        </button>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => i < currentStep && animateToStep(i, "back")}
              className={`rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-6 h-2 bg-stone-700"
                  : i < currentStep
                  ? "w-2 h-2 bg-stone-400 cursor-pointer hover:bg-stone-600"
                  : "w-2 h-2 bg-stone-200 cursor-default"
              }`}
            />
          ))}
        </div>

        {/* Step label */}
        <p className="text-center text-xs text-stone-400 tracking-[0.2em] uppercase mb-4">
          {currentStep + 1} / {TOTAL_STEPS} — {stepTitles[currentStep]}
        </p>

        {/* Step content */}
        <div style={slideStyle}>

          {/* Step 0: Location */}
          {currentStep === 0 && (
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
                    <button onClick={() => { setManualMode(true); setManualInput([location.city, location.prefecture].filter(Boolean).join(" ")); }} className="text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600">編集</button>
                    <button onClick={getLocation} className="text-sm text-stone-600 underline underline-offset-2 hover:text-stone-800">GPS更新</button>
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
                    <button onClick={handleManualLocation} disabled={locationLoading || !manualInput.trim()} className="px-4 py-2.5 bg-stone-700 text-white rounded-xl font-semibold text-sm hover:bg-stone-800 disabled:opacity-50">
                      {locationLoading ? "⏳" : "決定"}
                    </button>
                  </div>
                  <button onClick={() => { setManualMode(false); if (!location) getLocation(); }} className="text-xs text-stone-400 hover:text-stone-600">← GPSで取得する</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={getLocation} disabled={locationLoading} className="w-full py-3 bg-stone-700 text-white rounded-xl font-semibold hover:bg-stone-800 active:bg-stone-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 tracking-wide">
                    {locationLoading ? <><span className="animate-spin">⏳</span> 取得中...</> : <>📍 現在地を自動取得する</>}
                  </button>
                  <button onClick={() => setManualMode(true)} className="w-full py-2.5 border border-stone-200 text-stone-500 rounded-xl text-sm font-medium hover:border-stone-400 hover:text-stone-700 transition-colors bg-white/50">
                    ✏️ 地名を手動で入力する
                  </button>
                </div>
              )}
              {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
            </section>
          )}

          {/* Step 1: Date & Time */}
          {currentStep === 1 && (
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
                  onClick={() => {
                    const now = new Date();
                    setSelectedDate(now.toISOString().split("T")[0]);
                    setSelectedStartTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
                  }}
                  className="flex-shrink-0 px-3 py-2.5 bg-stone-700 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap"
                >
                  いまから！
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Companion + Travel Range */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
                <h2 className="text-base font-bold text-stone-700 mb-1">👥 誰と行く？</h2>
                <p className="text-xs text-stone-400 mb-4">任意 — スキップしてもOK</p>
                <div className="grid grid-cols-4 gap-2">
                  {companionOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setSelectedCompanion(selectedCompanion === opt.value ? null : opt.value)}
                      className={`py-3 px-1 rounded-xl border transition-all text-center ${selectedCompanion === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
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
                    <button key={opt.value} onClick={() => setSelectedTravelRange(selectedTravelRange === opt.value ? null : opt.value)}
                      className={`py-3 px-1 rounded-xl border transition-all text-center ${selectedTravelRange === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="font-semibold text-[11px] leading-tight">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Step 3: Time + Budget */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
                <h2 className="text-base font-bold text-stone-700 mb-4">⏱️ 使える時間は？</h2>
                <div className="grid grid-cols-3 gap-2">
                  {timeOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setSelectedTime(opt.value)}
                      className={`py-3 px-2 rounded-xl border transition-all text-center ${selectedTime === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
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
                    <button key={opt.value} onClick={() => setSelectedBudget(opt.value)}
                      className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedBudget === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Step 4: Mood + Fatigue */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60">
                <h2 className="text-base font-bold text-stone-700 mb-4">🎭 今日の気分は？</h2>
                <div className="grid grid-cols-2 gap-2">
                  {moodOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setSelectedMood(opt.value)}
                      className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedMood === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
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
                    <button key={opt.value} onClick={() => setSelectedFatigue(selectedFatigue === opt.value ? null : opt.value)}
                      className={`py-3 px-4 rounded-xl border transition-all text-left ${selectedFatigue === opt.value ? "border-stone-600 bg-stone-50 text-stone-800" : "border-stone-200 text-stone-500 hover:border-stone-400 bg-white/50"}`}>
                      <div className="text-2xl">{opt.emoji}</div>
                      <div className="font-semibold text-sm mt-1">{opt.label}</div>
                      <div className="text-xs text-stone-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <button onClick={goBack} className="px-5 py-3 border border-stone-300 text-stone-600 rounded-2xl font-semibold text-sm hover:bg-white/60 transition-colors">
              ← 戻る
            </button>
          )}
          {currentStep < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext[currentStep]}
              className={`flex-1 py-3 rounded-2xl font-semibold text-sm tracking-widest transition-all ${
                canGoNext[currentStep]
                  ? "bg-stone-800 text-white hover:bg-stone-900 shadow-md active:scale-[0.98]"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
            >
              次へ →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canGoNext[currentStep] || isSubmitting}
              className={`flex-1 py-3 rounded-2xl font-semibold text-sm tracking-widest uppercase transition-all ${
                canGoNext[currentStep]
                  ? "bg-stone-800 text-white hover:bg-stone-900 shadow-lg active:scale-[0.98]"
                  : "bg-stone-200 text-stone-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "— 考え中 —" : "今日のプランを見る ✨"}
            </button>
          )}
        </div>

        {!canGoNext[currentStep] && currentStep !== 0 && (
          <p className="text-center text-xs text-stone-500 mt-2">
            {currentStep === 3 ? "時間と予算を選んでください" : "気分を選んでください"}
          </p>
        )}

      </div>
    </main>
  );
}
