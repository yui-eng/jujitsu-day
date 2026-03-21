"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import type { PlaceInfo } from "../api/suggest/route";

interface Mission {
  emoji: string;
  title: string;
  desc: string;
}

const missionsByMood: Record<string, Mission[]> = {
  active: [
    { emoji: "👟", title: "5,000歩あるく", desc: "今日は歩数を意識してみよう" },
    { emoji: "🏃", title: "いつもと違う道を通る", desc: "新しいルートを発見しよう" },
    { emoji: "🧗", title: "エレベーターを使わない", desc: "階段で体を動かそう" },
    { emoji: "🤸", title: "30分間休まず歩き続ける", desc: "ペースを保ちながら歩こう" },
    { emoji: "🌄", title: "高い場所から景色を眺める", desc: "展望台や坂の上を目指そう" },
  ],
  relaxed: [
    { emoji: "☁️", title: "10分間空を見上げる", desc: "雲の形を観察してみよう" },
    { emoji: "🌿", title: "公園のベンチで深呼吸", desc: "ゆっくり5回、深く息を吸おう" },
    { emoji: "📖", title: "カフェで読書を楽しむ", desc: "お気に入りの本を1章読もう" },
    { emoji: "🎵", title: "お気に入りの曲を聴きながら歩く", desc: "音楽で気分を上げよう" },
    { emoji: "🧘", title: "静かな場所で5分間目を閉じる", desc: "何も考えない時間を作ろう" },
  ],
  social: [
    { emoji: "📸", title: "誰かと一緒に写真を撮る", desc: "思い出の1枚を残そう" },
    { emoji: "☕", title: "初めて入るカフェに挑戦", desc: "新しいお気に入りを見つけよう" },
    { emoji: "😊", title: "店員さんに笑顔で話しかける", desc: "小さなつながりを大切に" },
    { emoji: "🎮", title: "友達と何か一緒に体験する", desc: "共通の思い出を作ろう" },
    { emoji: "🤝", title: "知らない人に道を教えてあげる", desc: "親切を実践しよう" },
  ],
  creative: [
    { emoji: "🌸", title: "花を1枚写真に撮る", desc: "アングルにこだわってみよう" },
    { emoji: "🎨", title: "気になるものを5枚写真に撮る", desc: "テーマを決めて撮影しよう" },
    { emoji: "✏️", title: "目に入った景色をメモに書く", desc: "言葉で景色を描いてみよう" },
    { emoji: "🔍", title: "ストリートアートを探す", desc: "まちのアートを発見しよう" },
    { emoji: "🍃", title: "気に入った葉っぱや石を拾う", desc: "自然のオブジェを集めよう" },
  ],
  nature: [
    { emoji: "🌺", title: "花を1輪写真に撮る", desc: "季節の花を見つけよう" },
    { emoji: "🐦", title: "鳥の声を聞き止める", desc: "何種類の鳥の声がするか数えよう" },
    { emoji: "🌳", title: "大きな木を見つけて触れる", desc: "樹皮の感触を感じよう" },
    { emoji: "🪲", title: "小さな生き物を観察する", desc: "虫や小動物を探してみよう" },
    { emoji: "🌅", title: "水辺を探して立ち寄る", desc: "川や池のほとりで一息つこう" },
  ],
  foodie: [
    { emoji: "🍜", title: "食べたことのないメニューを頼む", desc: "冒険心でオーダーしよう" },
    { emoji: "📷", title: "料理の写真を撮ってから食べる", desc: "美しい1枚を残そう" },
    { emoji: "🏪", title: "初めて入るお店に挑戦", desc: "新しい出会いがあるかも" },
    { emoji: "🧁", title: "気になるスイーツを買う", desc: "デザートで気分を上げよう" },
    { emoji: "🛒", title: "地元の食材を1つ買って帰る", desc: "その土地の味を持ち帰ろう" },
  ],
};

const defaultMissions: Mission[] = [
  { emoji: "📸", title: "今日の景色を1枚撮る", desc: "お気に入りの瞬間を残そう" },
  { emoji: "☕", title: "知らないカフェに入ってみる", desc: "新しいお気に入りを探そう" },
  { emoji: "🚶", title: "3,000歩あるく", desc: "歩数を意識して動いてみよう" },
];

function pickMissions(mood: string | null, time: string | null): Mission[] {
  const pool = (mood && missionsByMood[mood]) ? missionsByMood[mood] : defaultMissions;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const count = time === "allday" ? 3 : time === "halfday" ? 3 : 2;
  return shuffled.slice(0, count);
}

function MissionCard({ missions }: { missions: Mission[] }) {
  const [done, setDone] = useState<boolean[]>(missions.map(() => false));

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const allDone = done.every(Boolean);

  return (
    <div className="bg-white/75 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60 mb-5">
      <h2 className="text-sm font-semibold text-stone-600 mb-3 flex items-center gap-2 tracking-wider uppercase">
        <span className="text-base">🎯</span>
        今日のミッション
        {allDone && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">
            全達成！
          </span>
        )}
      </h2>
      <div className="space-y-2">
        {missions.map((mission, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
              done[i]
                ? "bg-stone-50 border-stone-300 opacity-60"
                : "bg-white/60 border-stone-200 hover:border-stone-400"
            }`}
          >
            <span className="text-xl flex-shrink-0">{mission.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-snug ${done[i] ? "line-through text-stone-400" : "text-stone-800"}`}>
                {mission.title}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">{mission.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              done[i] ? "bg-stone-700 border-stone-700" : "border-stone-300"
            }`}>
              {done[i] && <span className="text-white text-[10px]">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

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
  startTime?: string;
  transport?: { method: string; duration: string } | null;
  lat?: number;
  lng?: number;
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
      {(suggestion.mapsUrl || suggestion.mapsSearchQuery || suggestion.lat) && (
        <div className="mt-3 pt-3 border-t border-gray-100 ml-9">
          <a
            href={
              suggestion.lat && suggestion.lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${suggestion.lat},${suggestion.lng}&travelmode=transit`
                : suggestion.mapsSearchQuery
                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(suggestion.mapsSearchQuery)}&travelmode=transit`
                : suggestion.mapsUrl!
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-900 transition-colors active:scale-[0.98] mb-2"
          >
            📍 ここに行く！
          </a>
          <div className="flex gap-2 flex-wrap">
            {suggestion.mapsUrl && (
              <a href={suggestion.mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors font-medium">
                🗺️ Mapsで見る
              </a>
            )}
            {suggestion.websiteUrl && (
              <a href={suggestion.websiteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 bg-green-50 text-green-600 text-xs px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">
                🌐 公式サイト
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineView({ suggestions, categoryConfig }: { suggestions: Suggestion[]; categoryConfig: Record<string, { color: string; icon: string }> }) {
  return (
    <div className="relative">
      <div className="absolute left-[52px] top-0 bottom-0 w-px bg-stone-200" />
      <div className="space-y-0">
        {suggestions.map((s, i) => {
          const catConfig = categoryConfig[s.category] || { color: "bg-stone-100 text-stone-600", icon: "📌" };
          return (
            <div key={i}>
              {s.transport && (
                <div className="flex items-center gap-2 pl-[68px] py-1.5">
                  <span className="text-stone-400 text-xs">▼ {s.transport.method}・{s.transport.duration}</span>
                </div>
              )}
              <div className="flex gap-3 items-start">
                <div className="flex flex-col items-center w-[52px] flex-shrink-0 pt-1">
                  <span className="text-xs font-bold text-stone-600 tabular-nums leading-none">{s.startTime || ""}</span>
                  <div className="mt-1.5 w-3 h-3 rounded-full bg-stone-700 border-2 border-white z-10" />
                </div>
                <div className="flex-1 bg-white/75 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-stone-200/60 mb-3">
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="text-xl flex-shrink-0">{catConfig.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-800 text-sm leading-snug">{s.title}</h3>
                        {s.isSeasonalEvent && (
                          <span className="flex-shrink-0 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">旬</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed mb-2 ml-7">{s.description}</p>
                  {s.seasonalNote && (
                    <div className="ml-7 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-lg mb-2">
                      <p className="text-orange-700 text-xs leading-relaxed">🌸 {s.seasonalNote}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 ml-7">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catConfig.color}`}>{s.category}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">⏱️ {s.estimatedTime}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">💰 {s.estimatedCost}</span>
                  </div>
                  {s.tips && (
                    <div className="mt-2 pt-2 border-t border-gray-100 ml-7">
                      <p className="text-xs text-gray-500 leading-relaxed">💡 {s.tips}</p>
                    </div>
                  )}
                  {(s.mapsUrl || s.mapsSearchQuery || s.lat) && (
                    <div className="mt-2 pt-2 border-t border-gray-100 ml-7">
                      <a
                        href={
                          s.lat && s.lng
                            ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=transit`
                            : s.mapsSearchQuery
                            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.mapsSearchQuery)}&travelmode=transit`
                            : s.mapsUrl!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2 bg-stone-800 text-white rounded-xl text-xs font-semibold hover:bg-stone-900 transition-colors mb-1.5"
                      >
                        📍 ここに行く！
                      </a>
                      <div className="flex gap-2 flex-wrap">
                        {s.mapsUrl && (
                          <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors font-medium">
                            🗺️ Mapsで見る
                          </a>
                        )}
                        {s.websiteUrl && (
                          <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors font-medium">
                            🌐 公式サイト
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
  const [retryKey, setRetryKey] = useState(0);
  const [viewMode, setViewMode] = useState<"card" | "timeline">("card");
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceInfo[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<PlaceInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const streamBoxRef = useRef<HTMLDivElement>(null);

  const handleRegenerate = () => {
    setData(null);
    setError(null);
    setLoading(true);
    setStreamingText("");
    setRetryKey((k) => k + 1);
  };

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
  const startTime = searchParams.get("startTime");

  // Auto-scroll streaming text box
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [streamingText]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, city, prefecture, time, budget, mood, date, startTime, companion, travelRange, fatigue }),
          signal: controller.signal,
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
            if (matchedPlace.lat) s.lat = matchedPlace.lat;
            if (matchedPlace.lng) s.lng = matchedPlace.lng;
          } else if (s.mapsSearchQuery) {
            const query = encodeURIComponent(`${s.mapsSearchQuery} ${locationStr}`);
            s.mapsUrl = `https://www.google.com/maps/search/${query}`;
          }
          delete s.mapsSearchQuery;
          return s;
        });

        if (weatherFromMeta) parsed.weather = weatherFromMeta;

        setNearbyPlaces(placesFromMeta);
        setStreamingText("");
        setData(parsed);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchSuggestions();
    return () => controller.abort();
  }, [lat, lng, city, prefecture, time, budget, mood, date, companion, travelRange, fatigue, retryKey]);

  const locationLabel = [city, prefecture].filter(Boolean).join("、") || "現在地";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const missions = useState(() => pickMissions(mood, time))[0];

  // 地図用マーカーパラメータ生成（lat/lngを持つスポット最大8件）
  const mapMarkersParam = nearbyPlaces
    .filter((p) => p.lat && p.lng)
    .slice(0, 8)
    .map((p) => `${p.name},${p.lat},${p.lng}`)
    .join("|");

  // AIが提案したスポットのマーカー（lat/lngが紐付いているもの）
  const suggestionMarkersParam = (data?.suggestions ?? [])
    .filter((s) => s.lat && s.lng)
    .slice(0, 6)
    .map((s) => `${s.title},${s.lat},${s.lng}`)
    .join("|");

  const staticMapSrc =
    lat && lng
      ? `/api/map-static?lat=${lat}&lng=${lng}${mapMarkersParam ? `&markers=${encodeURIComponent(mapMarkersParam)}` : ""}${suggestionMarkersParam ? `&suggestions=${encodeURIComponent(suggestionMarkersParam)}` : ""}${selectedSpot?.lat ? `&selected=${selectedSpot.lat},${selectedSpot.lng}` : ""}`
      : null;

  // 選択したスポットへのルートURL
  const goToSpotUrl =
    selectedSpot?.lat && selectedSpot?.lng && lat && lng
      ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${selectedSpot.lat},${selectedSpot.lng}&travelmode=transit`
      : null;

  // Google Maps でルートを開く（スポット最大5件のwaypoints）
  const googleMapsRouteUrl = (() => {
    const spots = nearbyPlaces.filter((p) => p.lat && p.lng).slice(0, 5);
    if (!lat || !lng || spots.length === 0) {
      return `https://www.google.com/maps/search/${encodeURIComponent(locationLabel)}`;
    }
    const origin = `${lat},${lng}`;
    const destination = `${spots[spots.length - 1].lat},${spots[spots.length - 1].lng}`;
    const waypoints = spots
      .slice(0, -1)
      .map((p) => `${p.lat},${p.lng}`)
      .join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ""}&travelmode=transit`;
  })();

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
          今日のプラン
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
            <p className="text-xs opacity-60 mt-1 tracking-wider">プランを生成中...</p>
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

        {/* Mission card — shown once data is ready */}
        {data && <MissionCard missions={missions} />}

        {/* Results */}
        {data && (
          <>
            {/* Summary banner */}
            <div className="bg-stone-800 text-white rounded-2xl p-4 mb-5 shadow-md">
              <p
                className="text-xs opacity-60 mb-1 tracking-widest uppercase"
                style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic" }}
              >
                AIより
              </p>
              <p className="font-medium leading-relaxed">{data.summary}</p>
              {data.weather && (
                <p className="text-xs opacity-60 mt-2">
                  🌤️ {data.weather}
                </p>
              )}
            </div>

            {/* 近くのスポット候補（選択式） */}
            {nearbyPlaces.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-stone-500 font-medium mb-2 px-1">📍 近くのスポット候補</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                  {nearbyPlaces
                    .slice(0, 8)
                    .map((place, i) => {
                      const isSelected = selectedSpot?.name === place.name;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (!place.lat || !place.lng) return;
                            setSelectedSpot(isSelected ? null : place);
                            setMapError(false);
                          }}
                          className={`flex-shrink-0 flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-2xl border transition-all text-left min-w-[120px] max-w-[150px] ${
                            isSelected
                              ? "bg-stone-800 text-white border-stone-800 shadow-md"
                              : place.lat && place.lng
                              ? "bg-white/80 text-stone-700 border-stone-200 hover:border-stone-400 cursor-pointer"
                              : "bg-white/60 text-stone-500 border-stone-100 cursor-default"
                          }`}
                        >
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 ${isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-semibold leading-snug line-clamp-2">{place.name}</span>
                          <span className={`text-[11px] truncate w-full ${isSelected ? "text-stone-300" : "text-stone-400"}`}>{place.type}</span>
                          {place.rating && (
                            <span className={`text-[11px] ${isSelected ? "text-amber-300" : "text-amber-500"}`}>★ {place.rating}</span>
                          )}
                        </button>
                      );
                    })}
                </div>
                {goToSpotUrl && (
                  <a
                    href={goToSpotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full py-3 bg-stone-800 text-white rounded-2xl text-sm font-semibold hover:bg-stone-900 transition-colors shadow-md"
                  >
                    📍 {selectedSpot?.name} へ行く
                  </a>
                )}
              </div>
            )}

            {/* Map section */}
            {staticMapSrc && (
              <div className="bg-white/75 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 mb-5">
                <button
                  onClick={() => setShowMap((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                >
                  <span className="flex items-center gap-2 font-semibold text-stone-700 text-sm">
                    🗺️ エリアマップ
                    {nearbyPlaces.filter((p) => p.lat && p.lng).length > 0 && (
                      <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">
                        {nearbyPlaces.filter((p) => p.lat && p.lng).length}件のスポット
                      </span>
                    )}
                  </span>
                  <span className="text-stone-400 text-sm">{showMap ? "▲" : "▼"}</span>
                </button>
                {showMap && (
                  <>
                    <div className="relative w-full" style={{ aspectRatio: "600/320" }}>
                      {mapError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 gap-3 px-6 text-center">
                          <span className="text-3xl">🗺️</span>
                          <p className="text-sm font-medium text-stone-600">地図を表示できませんでした</p>
                          <p className="text-xs text-stone-400 leading-relaxed">
                            Google Cloud Console で<br/>
                            <span className="font-semibold text-stone-500">Maps Static API</span> を有効にしてください
                          </p>
                        </div>
                      ) : (
                        <>
                          <Image src={staticMapSrc!} alt="エリアマップ" fill className="object-cover" unoptimized onError={() => setMapError(true)} />
                          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-stone-600 shadow-sm space-y-0.5">
                            <div><span className="text-blue-500 font-bold">★</span> 現在地</div>
                            <div><span className="text-red-500 font-bold">●</span> 近くのスポット</div>
                            {suggestionMarkersParam && <div><span className="text-green-600 font-bold">●</span> AIおすすめ</div>}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="px-4 pb-4 pt-2">
                      <a href={goToSpotUrl ?? googleMapsRouteUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-stone-800 text-white rounded-xl text-sm font-semibold hover:bg-stone-900 transition-colors">
                        {goToSpotUrl ? `📍 ${selectedSpot?.name} へ行く` : "🗺️ Google Maps でルートを確認する"}
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* View toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setViewMode("card")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "card" ? "bg-stone-800 text-white" : "bg-white/70 text-stone-600 border border-stone-200"}`}>
                🃏 カード表示
              </button>
              <button onClick={() => setViewMode("timeline")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${viewMode === "timeline" ? "bg-stone-800 text-white" : "bg-white/70 text-stone-600 border border-stone-200"}`}>
                🕙 タイムライン
              </button>
            </div>

            {/* Activity cards */}
            {viewMode === "card" ? (
              <div className="space-y-4">
                {data.suggestions.map((suggestion, index) => {
                  const catConfig = categoryConfig[suggestion.category] || { color: "bg-stone-100 text-stone-600", icon: "📌" };
                  return (
                    <FadeInCard key={index} index={index} suggestion={suggestion} catConfig={catConfig} />
                  );
                })}
              </div>
            ) : (
              <TimelineView suggestions={data.suggestions} categoryConfig={categoryConfig} />
            )}

            {/* Share */}
            <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-stone-200/60">
              <p className="text-xs font-semibold text-stone-500 mb-3 tracking-wider uppercase">シェアする</p>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`今日のお出かけスポットをシェア！🗺️\n📍 ${locationLabel}\n${data.summary}\n#Joie #充実した一日`)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition-colors"
                >
                  𝕏 ポスト
                </a>
                <a
                  href={`https://line.me/R/msg/text/?${encodeURIComponent(`今日のお出かけスポットをシェア！🗺️\n📍 ${locationLabel}\n${data.summary}\n#Joie\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#06C755] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  LINE
                </a>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-semibold hover:bg-stone-200 transition-colors border border-stone-200"
                >
                  {copied ? "✅ コピー済" : "🔗 リンクコピー"}
                </button>
              </div>
            </div>

            {/* Retry */}
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={handleRegenerate}
                className="bg-white/80 border border-stone-300 text-stone-700 px-6 py-3 rounded-2xl font-semibold hover:bg-white transition-all shadow-sm text-sm active:scale-[0.98]"
              >
                🔄 再生成
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-stone-800 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-stone-900 transition-all shadow-md tracking-widest uppercase text-sm active:scale-[0.98]"
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
