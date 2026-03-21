export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 pb-12">
        <div className="h-7 w-16 bg-stone-200 rounded-full mb-5 animate-pulse" />
        <div className="h-8 w-48 bg-stone-200 rounded-xl mb-4 animate-pulse" />

        {/* Preferences skeleton */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 mb-5 shadow-sm border border-stone-200/60">
          <div className="flex gap-2">
            {[80, 64, 72, 88].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-stone-100 animate-pulse" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        <div className="bg-stone-800 text-white rounded-2xl p-5 mb-5 shadow-md text-center">
          <div className="text-3xl mb-2 animate-bounce">✨</div>
          <p className="font-semibold tracking-wide">AIがプランを考え中...</p>
          <p className="text-xs opacity-60 mt-1 tracking-wider">プランを生成中...</p>
        </div>

        {/* Card skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-stone-200/60 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-stone-200" />
                <div className="h-5 bg-stone-200 rounded w-40" />
              </div>
              <div className="space-y-2 ml-9">
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
