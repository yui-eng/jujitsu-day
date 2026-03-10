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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">😢</div>
        <p className="font-bold text-gray-800 mb-1">エラーが発生しました</p>
        <p className="text-sm text-gray-500 mb-5">{error.message || "予期しないエラーが起きました"}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            もう一度試す
          </button>
          <button
            onClick={() => router.push("/")}
            className="border-2 border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:border-amber-300 hover:text-amber-700 transition-colors"
          >
            トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
