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
      className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50"
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
          body: JSON.stringify({ lat, lng, city, prefecture, time, budget, mood }),
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
  }, [lat, lng, city, prefecture, time, budget, mood]);

  const locationLabel = [city, prefecture].filter(Boolean).join("、") || "現在地";

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50/70 via-amber-50/60 to-yellow-50/70">
      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        {/* Header */}
        <div className="flex items-center mb-5">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium mr-auto"
          >
            ← 戻る
          </button>
        </div>

        <h1 className="text-2xl font-bold text-amber-800 mb-4">
          今日の充実プラン ✨
        </h1>

        {/* Preferences summary */}
        <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-amber-100">
          <div className="flex flex-wrap gap-2">
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
              📍 {locationLabel}
            </span>
            {time && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                ⏱️ {timeLabels[time]}
              </span>
            )}
            {budget && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                💰 {budgetLabels[budget]}
              </span>
            )}
            {mood && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {moodLabels[mood]}
              </span>
            )}
          </div>
        </div>

        {/* Loading + Streaming */}
        {loading && (
          <div className="mb-5">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-md text-center mb-3">
              <div className="text-3xl mb-2 animate-bounce">✨</div>
              <p className="font-semibold">AIがプランを考え中...</p>
              <p className="text-xs opacity-80 mt-1">リアルタイムで生成しています</p>
            </div>

            {streamingText && (
              <div className="bg-gray-900 rounded-xl p-4 shadow-inner">
                <p className="text-gray-500 text-xs mb-2 font-mono">● AIの思考ストリーム</p>
                <div
                  ref={streamBoxRef}
                  className="text-green-400 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all overflow-y-auto max-h-48"
                >
                  {streamingText}
                  <span className="inline-block w-2 h-3 bg-green-400 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
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
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 mb-5 shadow-md">
              <p className="text-xs opacity-80 mb-1 font-medium">AIからの一言</p>
              <p className="font-semibold leading-relaxed">{data.summary}</p>
              {data.weather && (
                <p className="text-xs opacity-80 mt-2">
                  🌤️ 現在の天気: {data.weather}
                </p>
              )}
            </div>

            {/* Activity cards */}
            <div className="space-y-4">
              {data.suggestions.map((suggestion, index) => {
                const catConfig = categoryConfig[suggestion.category] || { color: "bg-gray-100 text-gray-600", icon: "📌" };
                return (
                  <FadeInCard key={index} index={index} suggestion={suggestion} catConfig={catConfig} />
                );
              })}
            </div>

            {/* Retry */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200 active:scale-[0.98]"
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50/70 via-amber-50/60 to-yellow-50/70 flex items-center justify-center">
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
