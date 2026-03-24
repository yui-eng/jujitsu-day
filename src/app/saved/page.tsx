"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { SavedPlan } from "../results/page";

const SAVED_PLANS_KEY = "joie_saved_plans";

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

export default function SavedPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setPlans(JSON.parse(localStorage.getItem(SAVED_PLANS_KEY) || "[]"));
    } catch {
      setPlans([]);
    }
  }, []);

  const deletePlan = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    setPlans(updated);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated));
    if (expandedId === id) setExpandedId(null);
  };

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
        <p className="text-stone-400 text-xs tracking-[0.3em] uppercase mb-6">
          Saved plans
        </p>

        {plans.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center shadow-sm border border-stone-200/60">
            <p className="text-4xl mb-3">🔖</p>
            <p className="text-stone-600 font-medium">保存したプランはまだありません</p>
            <p className="text-stone-400 text-sm mt-1">プランを提案してもらったら保存できます</p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-900 transition-colors"
            >
              プランを作る
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const isOpen = expandedId === plan.id;
              const savedDate = new Date(plan.savedAt).toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={plan.id}
                  className="bg-white/75 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden"
                >
                  {/* Card header (always visible) */}
                  <button
                    className="w-full p-4 text-left"
                    onClick={() => setExpandedId(isOpen ? null : plan.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 text-sm leading-snug truncate">
                          📍 {plan.params.location || "不明な場所"}
                        </p>
                        <p className="text-stone-500 text-xs mt-0.5">
                          {plan.params.date} ·{" "}
                          {timeLabels[plan.params.time] || plan.params.time} ·{" "}
                          {budgetLabels[plan.params.budget] || plan.params.budget} ·{" "}
                          {moodLabels[plan.params.mood] || plan.params.mood}
                        </p>
                        <p className="text-stone-400 text-xs mt-1">保存日: {savedDate}</p>
                      </div>
                      <span className="text-stone-400 text-xs mt-0.5 flex-shrink-0">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-stone-100">
                      {/* Summary */}
                      <div className="bg-stone-800 text-white rounded-xl p-3 mt-3 mb-3">
                        <p className="text-xs opacity-60 mb-1 tracking-widest uppercase"
                          style={{ fontStyle: "italic" }}>from AI</p>
                        <p className="text-sm leading-relaxed">{plan.data.summary}</p>
                        {plan.data.weather && (
                          <p className="text-xs opacity-60 mt-1.5">🌤️ {plan.data.weather}</p>
                        )}
                      </div>

                      {/* Suggestions */}
                      <div className="space-y-2">
                        {plan.data.suggestions.map((s, i) => (
                          <div
                            key={i}
                            className="bg-stone-50/80 rounded-xl p-3 border border-stone-100"
                          >
                            <p className="font-semibold text-stone-800 text-sm">{s.title}</p>
                            <p className="text-stone-600 text-xs mt-1 leading-relaxed">{s.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">
                                ⏱️ {s.estimatedTime}
                              </span>
                              <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">
                                💰 {s.estimatedCost}
                              </span>
                            </div>
                            {(s.mapsUrl || s.websiteUrl) && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {s.mapsUrl && (
                                  <a
                                    href={s.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-xs underline"
                                  >
                                    🗺️ Maps
                                  </a>
                                )}
                                {s.websiteUrl && (
                                  <a
                                    href={s.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 text-xs underline"
                                  >
                                    🌐 公式
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => deletePlan(plan.id)}
                        className="mt-4 w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        削除する
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
