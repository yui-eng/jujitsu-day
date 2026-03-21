"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TimeOption, BudgetOption, FatigueOption, MoodOption,
  CompanionOption, TravelRangeOption, LocationInfo,
} from "./_steps/types";
import StepLocation from "./_steps/StepLocation";
import StepDateTime from "./_steps/StepDateTime";
import StepMember from "./_steps/StepMember";
import StepTimeBudget from "./_steps/StepTimeBudget";
import StepMood from "./_steps/StepMood";

const TOTAL_STEPS = 5;
const stepTitles = ["現在地", "日付・時間", "メンバー", "時間・予算", "気分・体調"];

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

  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [slideDir, setSlideDir] = useState<"forward" | "back">("forward");

  const canGoNext = [
    !!location,
    true,
    true,
    !!selectedTime && !!selectedBudget,
    !!selectedMood,
  ];

  const animateToStep = (next: number, dir: "forward" | "back") => {
    setSlideDir(dir);
    setVisible(false);
    setTimeout(() => { setCurrentStep(next); setVisible(true); }, 220);
  };

  const goNext = () => { if (currentStep < TOTAL_STEPS - 1) animateToStep(currentStep + 1, "forward"); };
  const goBack = () => { if (currentStep > 0) animateToStep(currentStep - 1, "back"); };

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

  useEffect(() => {
    if (location && currentStep === 0) {
      setTimeout(() => animateToStep(1, "forward"), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const slideStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0px)" : slideDir === "forward" ? "translateX(24px)" : "translateX(-24px)",
    transition: "opacity 0.22s ease, transform 0.22s ease",
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-10 pb-12">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-7xl text-stone-800 leading-none" style={{ fontFamily: "var(--font-dancing)", textShadow: "0 2px 8px rgba(255,255,255,0.6)" }}>
            Joie
          </h1>
          <p className="text-stone-600 mt-1 text-sm tracking-[0.3em]" style={{ textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>ジョワ</p>
          <p className="text-stone-500 mt-2 text-[10px] tracking-[0.3em] uppercase" style={{ textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}>あなただけの一日を</p>
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
                i === currentStep ? "w-6 h-2 bg-stone-700" : i < currentStep ? "w-2 h-2 bg-stone-400 cursor-pointer hover:bg-stone-600" : "w-2 h-2 bg-stone-200 cursor-default"
              }`}
            />
          ))}
        </div>

        {/* Step label */}
        <p className="text-center text-xs text-stone-400 tracking-[0.2em] uppercase mb-4">
          {currentStep + 1} / {TOTAL_STEPS} — {stepTitles[currentStep]}
          {currentStep > 0 && <span className="ml-2 text-stone-300 normal-case tracking-normal">（ドットで戻れます）</span>}
        </p>

        {/* Step content */}
        <div style={slideStyle}>
          {currentStep === 0 && (
            <StepLocation
              location={location} locationLoading={locationLoading} locationError={locationError}
              manualMode={manualMode} manualInput={manualInput}
              setManualMode={setManualMode} setManualInput={setManualInput}
              getLocation={getLocation} handleManualLocation={handleManualLocation}
            />
          )}
          {currentStep === 1 && (
            <StepDateTime
              selectedDate={selectedDate} selectedStartTime={selectedStartTime}
              setSelectedDate={setSelectedDate} setSelectedStartTime={setSelectedStartTime}
            />
          )}
          {currentStep === 2 && (
            <StepMember
              selectedCompanion={selectedCompanion} selectedTravelRange={selectedTravelRange}
              setSelectedCompanion={setSelectedCompanion} setSelectedTravelRange={setSelectedTravelRange}
            />
          )}
          {currentStep === 3 && (
            <StepTimeBudget
              selectedTime={selectedTime} selectedBudget={selectedBudget}
              setSelectedTime={setSelectedTime} setSelectedBudget={setSelectedBudget}
            />
          )}
          {currentStep === 4 && (
            <StepMood
              selectedMood={selectedMood} selectedFatigue={selectedFatigue}
              setSelectedMood={setSelectedMood} setSelectedFatigue={setSelectedFatigue}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-5 py-3 bg-white/80 border-2 border-stone-300 text-stone-700 rounded-2xl font-bold text-sm hover:border-stone-500 hover:bg-white active:scale-[0.97] transition-all shadow-sm"
            >
              <span className="text-base">‹</span> 戻る
            </button>
          )}
          {currentStep < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext[currentStep]}
              className={`flex-1 py-3 rounded-2xl font-semibold text-sm tracking-widest transition-all ${canGoNext[currentStep] ? "bg-stone-800 text-white hover:bg-stone-900 shadow-md active:scale-[0.98]" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
            >
              次へ →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canGoNext[currentStep] || isSubmitting}
              className={`flex-1 py-3 rounded-2xl font-semibold text-sm tracking-widest uppercase transition-all ${canGoNext[currentStep] ? "bg-stone-800 text-white hover:bg-stone-900 shadow-lg active:scale-[0.98]" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
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
