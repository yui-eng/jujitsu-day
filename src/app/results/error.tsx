"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-red-100 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">😢</div>
        <p className="font-bold text-stone-800 mb-1">エラーが発生しました</p>
        <p className="text-sm text-stone-500 mb-5">{error.message || "予期しないエラーが起きました"}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-stone-800 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-stone-900 transition-colors"
          >
            もう一度試す
          </button>
          <button
            onClick={() => router.push("/")}
            className="border border-stone-200 text-stone-600 px-5 py-2 rounded-xl text-sm font-medium hover:border-stone-400 hover:text-stone-800 transition-colors"
          >
            トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
