"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import type { PlaceInfo } from "../api/suggest/route";

interface Suggestion {
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  estimatedCost: string;
  isSeasonalEvent: boolean;
  seasonalNote?: string;
  tips?: string;
  placeName?: string;
  mapsUrl?: string;
  websiteUrl?: string;
  mapsSearchQuery?: string;
}

interface SuggestResponse {
  suggestions: Suggestion[];
  summary: string;
  weather?: string;
}

function FadeInCard({
  suggestion,
  index,
  catConfig,
}: {
  suggestion: Suggestion;
  index: number;
  catConfig: { color: string; icon: string };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Double rAF ensures the initial opacity:0 render is painted before transitioning
    const raf = requestAnimationFrame(() => {
      const t = setTimeout(() => setVisible(true), index * 150);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(raf);
  }, [index]);

  return (
    <div
      className="bg-white/75 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        willChange: "opacity, transform",
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-2xl mt-0.5 flex-shrink-0">{catConfig.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-800 text-base leading-snug">{suggestion.title}</h3>
            {suggestion.isSeasonalEvent && (
              <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">旬</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-3 ml-9">{suggestion.description}</p>
      {suggestion.seasonalNote && (
        <div className="ml-9 bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg mb-3">
          <p className="text-orange-700 text-xs leading-relaxed">🌸 {suggestion.seasonalNote}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 ml-9">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catConfig.color}`}>{suggestion.category}</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">⏱️ {suggestion.estimatedTime}</span>
        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">💰 {suggestion.estimatedCost}</span>
      </div>
      {suggestion.tips && (
        <div className="mt-3 pt-3 border-t border-gray-100 ml-9">
          <p className="text-xs text-gray-500 leading-relaxed">💡 {suggestion.tips}</p>
        </div>
      )}
      {(suggestion.mapsUrl || suggestion.websiteUrl) && (
        <div className="mt-3 pt-3 border-t border-gray-100 ml-9 flex gap-2 flex-wrap">
          {suggestion.mapsUrl && (
            <a href={suggestion.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors font-medium">
              🗺️ Google Mapsで見る
            </a>
          )}
          {suggestion.websiteUrl && (
            <a href={suggestion.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 bg-green-50 text-green-600 text-xs px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">
              🌐 公式サイト
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const categoryConfig: Record<string, { color: string; icon: string }> = {
  アウトドア: { color: "bg-green-100 text-green-700", icon: "🌲" },
  "文化・芸術": { color: "bg-purple-100 text-purple-700", icon: "🎭" },
  食: { color: "bg-orange-100 text-orange-700", icon: "🍽️" },
  スポーツ: { color: "bg-blue-100 text-blue-700", icon: "⚽" },
  リラックス: { color: "bg-pink-100 text-pink-700", icon: "🛁" },
  学び: { color: "bg-indigo-100 text-indigo-700", icon: "📚" },
  季節イベント: { color: "bg-red-100 text-red-700", icon: "🌸" },
  ショッピング: { color: "bg-yellow-100 text-yellow-700", icon: "🛍️" },
  観光: { color: "bg-teal-100 text-teal-700", icon: "🗺️" },
};

const timeLabels: Record<string, string> = {
  "2h": "2時間",
  halfday: "半日",
  allday: "丸1日",
};

const budgetLabels: Record<string, string> = {
  free: "無料",
  low: "〜¥1,000",
  medium: "〜¥5,000",
  high: "¥5,000〜",
};

const moodLabels: Record<string, string> = {
  active: "🏃 アクティブ",
  relaxed: "😌 のんびり",
  social: "🎉 わいわい",
  creative: "🎨 クリエイティブ",
  nature: "🌿 自然",
  foodie: "🍜 グルメ",
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SuggestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const streamBoxRef = useRef<HTMLDivElement>(null);

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const city = searchParams.get("city");
  const prefecture = searchParams.get("prefecture");
  const time = searchParams.get("time");
  const budget = searchParams.get("budget");
  const mood = searchParams.get("mood");
  const date = searchParams.get("date");
  const companion = searchParams.get("companion");
  const travelRange = searchParams.get("travelRange");
  const fatigue = searchParams.get("fatigue");

  // Auto-scroll streaming text box
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [streamingText]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, city, prefecture, time, budget, mood, date, companion, travelRange, fatigue }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "提案の取得に失敗しました");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let metaParsed = false;
        let weatherFromMeta = "";
        let placesFromMeta: PlaceInfo[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          if (!metaParsed) {
            accumulated += chunk;
            const nlIndex = accumulated.indexOf("\n");
            if (nlIndex !== -1) {
              const metaLine = accumulated.substring(0, nlIndex);
              if (metaLine.startsWith("__META__")) {
                const meta = JSON.parse(metaLine.slice(8));
                weatherFromMeta = meta.weather || "";
                placesFromMeta = meta.places || [];
                metaParsed = true;
                accumulated = accumulated.substring(nlIndex + 1);
                setStreamingText(accumulated);
              }
            }
          } else {
            accumulated += chunk;
            setStreamingText(accumulated);
          }
        }

        // Parse final JSON
        const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("応答の解析に失敗しました");

        const parsed = JSON.parse(jsonMatch[0]);

        // Enrich suggestions with places data
        const locationStr = [city, prefecture].filter(Boolean).join("、") || "日本";
        parsed.suggestions = parsed.suggestions.map((s: Suggestion) => {
          const matchedPlace = s.placeName
            ? placesFromMeta.find(
                (p) => p.name.includes(s.placeName!) || s.placeName!.includes(p.name)
              )
            : null;

          if (matchedPlace) {
            s.mapsUrl = matchedPlace.mapsUrl;
            if (matchedPlace.websiteUrl) s.websiteUrl = matchedPlace.websiteUrl;
          } else if (s.mapsSearchQuery) {
            const query = encodeURIComponent(`${s.mapsSearchQuery} ${locationStr}`);
            s.mapsUrl = `https://www.google.com/maps/search/${query}`;
          }
          delete s.mapsSearchQuery;
          return s;
        });

        if (weatherFromMeta) parsed.weather = weatherFromMeta;

        setStreamingText("");
        setData(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [lat, lng, city, prefecture, time, budget, mood, date, fatigue]);

  const locationLabel = [city, prefecture].filter(Boolean).join("、") || "現在地";

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        {/* Header */}
        <div className="flex items-center mb-5">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-stone-500 hover:text-stone-800 font-medium mr-auto tracking-wide text-sm"
          >
            ← 戻る
          </button>
        </div>

        <h1
          className="text-5xl text-stone-800 mb-1 leading-tight"
          style={{ fontFamily: "var(--font-dancing)" }}
        >
          Joie
        </h1>
        <p className="text-stone-400 text-xs tracking-[0.3em] uppercase mb-4">
          Today&apos;s plan
        </p>

        {/* Preferences summary */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-5 shadow-sm border border-stone-200/60">
          <div className="flex flex-wrap gap-2">
            <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm font-medium">
              📍 {locationLabel}
            </span>
            {time && (
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-medium">
                ⏱️ {timeLabels[time]}
              </span>
            )}
            {budget && (
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-medium">
                💰 {budgetLabels[budget]}
              </span>
            )}
            {mood && (
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-medium">
                {moodLabels[mood]}
              </span>
            )}
            {companion && (
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-medium">
                {companion === "solo" ? "🧍 ひとり" : companion === "friends" ? "👯 友達と" : companion === "couple" ? "💑 恋人と" : "👨‍👩‍👦 家族と"}
              </span>
            )}
            {travelRange && (
              <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-sm font-medium">
                {travelRange === "walk" ? "🚶 徒歩圏" : travelRange === "30min" ? "🚌 30分以内" : travelRange === "1hour" ? "🚃 1時間以内" : "✈️ どこでも"}
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-stone-800 text-white rounded-2xl p-5 shadow-md text-center mb-5">
            <div className="text-3xl mb-2 animate-bounce">✨</div>
            <p className="font-semibold tracking-wide">AIがプランを考え中...</p>
            <p className="text-xs opacity-60 mt-1 tracking-wider">generating your plan</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
            <p className="font-bold">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
            >
              最初からやり直す
            </button>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Summary banner */}
            <div className="bg-stone-800 text-white rounded-2xl p-4 mb-5 shadow-md">
              <p
                className="text-xs opacity-60 mb-1 tracking-widest uppercase"
                style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic" }}
              >
                from AI
              </p>
              <p className="font-medium leading-relaxed">{data.summary}</p>
              {data.weather && (
                <p className="text-xs opacity-60 mt-2">
                  🌤️ {data.weather}
                </p>
              )}
            </div>

            {/* Activity cards */}
            <div className="space-y-4">
              {data.suggestions.map((suggestion, index) => {
                const catConfig = categoryConfig[suggestion.category] || { color: "bg-stone-100 text-stone-600", icon: "📌" };
                return (
                  <FadeInCard key={index} index={index} suggestion={suggestion} catConfig={catConfig} />
                );
              })}
            </div>

            {/* Retry */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push("/")}
                className="bg-stone-800 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-stone-900 transition-all shadow-md tracking-widest uppercase text-sm active:scale-[0.98]"
              >
                別の条件で探す
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">✨</div>
            <p className="text-amber-600 font-medium">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
