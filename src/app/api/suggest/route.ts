import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Open-Meteo weather code to Japanese description
const weatherCodes: Record<number, string> = {
  0: "快晴", 1: "ほぼ快晴", 2: "一部曇り", 3: "曇り",
  45: "霧", 48: "霧氷",
  51: "霧雨（弱）", 53: "霧雨", 55: "霧雨（強）",
  61: "小雨", 63: "雨", 65: "大雨",
  71: "小雪", 73: "雪", 75: "大雪",
  80: "にわか雨（弱）", 81: "にわか雨", 82: "激しいにわか雨",
  95: "雷雨", 96: "雷雨＋ひょう", 99: "激しい雷雨",
};

const timeLabels: Record<string, string> = {
  "2h": "2時間程度",
  halfday: "半日（3〜5時間）",
  allday: "丸1日（6時間以上）",
};

const budgetLabels: Record<string, string> = {
  free: "0円（完全無料）",
  low: "1,000円以下",
  medium: "1,000〜5,000円",
  high: "5,000円以上（特別な日）",
};

const moodLabels: Record<string, string> = {
  active: "アクティブ（体を動かしたい・スポーツ・運動）",
  relaxed: "のんびり（ゆったり・リラックス・癒し）",
  social: "わいわい（誰かと一緒に楽しみたい・賑やかな場所）",
  creative: "クリエイティブ（何か作りたい・芸術・ものづくり）",
  nature: "自然を感じたい（アウトドア・公園・山・海）",
  foodie: "グルメ（美食・グルメ探索・カフェ・スイーツ）",
};

const companionLabels: Record<string, string> = {
  solo: "ひとり（自由・マイペース）",
  friends: "友達と（グループ・みんなで楽しく）",
  couple: "恋人と（デート・ロマンチックな雰囲気）",
  family: "家族と（子連れOK・幅広い年齢層）",
};

const travelRangeLabels: Record<string, string> = {
  walk: "徒歩圏内（2km以内）",
  "30min": "電車・バスで30分以内",
  "1hour": "電車・バスで1時間以内",
  anywhere: "距離制限なし（遠出OK）",
};

export interface PlaceInfo {
  name: string;
  address: string;
  mapsUrl: string;
  websiteUrl?: string;
  rating?: number;
  type: string;
  lat?: number;
  lng?: number;
}

// Fetch nearby places using OpenStreetMap Overpass API (無料・APIキー不要)
async function fetchNearbyPlaces(lat: string, lng: string, mood: string): Promise<PlaceInfo[]> {
  const radius = 8000; // 8km

  const tagsByMood: Record<string, { key: string; values: string[] }[]> = {
    active: [
      { key: "leisure", values: ["sports_centre", "swimming_pool", "fitness_centre", "stadium"] },
      { key: "amenity", values: ["gym"] },
    ],
    relaxed: [
      { key: "amenity", values: ["spa", "cafe", "library"] },
      { key: "leisure", values: ["park", "garden"] },
    ],
    social: [
      { key: "amenity", values: ["restaurant", "bar", "cinema", "theatre", "bowling_alley"] },
    ],
    creative: [
      { key: "amenity", values: ["arts_centre", "library", "theatre"] },
      { key: "tourism", values: ["museum", "gallery"] },
    ],
    nature: [
      { key: "leisure", values: ["park", "garden", "nature_reserve"] },
      { key: "tourism", values: ["viewpoint"] },
    ],
    foodie: [
      { key: "amenity", values: ["restaurant", "cafe", "fast_food", "bakery"] },
    ],
  };

  const tagGroups = tagsByMood[mood] || [{ key: "amenity", values: ["restaurant", "cafe"] }];

  const typeLabels: Record<string, string> = {
    restaurant: "レストラン", cafe: "カフェ", bar: "バー", fast_food: "ファストフード",
    bakery: "ベーカリー", cinema: "映画館", theatre: "劇場", library: "図書館",
    arts_centre: "アートセンター", gym: "ジム", spa: "スパ", bowling_alley: "ボウリング場",
    sports_centre: "スポーツ施設", swimming_pool: "プール", fitness_centre: "フィットネス",
    stadium: "スタジアム", park: "公園", garden: "庭園", nature_reserve: "自然保護区",
    museum: "博物館", gallery: "ギャラリー", viewpoint: "展望台",
  };

  const unions = tagGroups
    .flatMap(({ key, values }) =>
      values.map((v) => `node["${key}"="${v}"](around:${radius},${lat},${lng});`)
    )
    .join("\n");

  const query = `[out:json][timeout:10];\n(\n${unions}\n);\nout 5;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return [];

    const data = await response.json();
    const elements = (data.elements || []) as {
      tags?: Record<string, string>;
      lat?: number;
      lon?: number;
    }[];

    const places: PlaceInfo[] = elements
      .filter((el) => el.tags?.name && el.lat && el.lon)
      .slice(0, 5)
      .map((el) => {
        const typeKey =
          el.tags?.amenity || el.tags?.leisure || el.tags?.tourism || "";
        return {
          name: el.tags!.name!,
          address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || "",
          mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(el.tags!.name!)}/@${el.lat},${el.lon},17z`,
          type: typeLabels[typeKey] || typeKey,
          lat: el.lat,
          lng: el.lon,
        };
      });

    return places;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, city, prefecture, time, budget, mood, date, companion, travelRange, fatigue } = await req.json();

    if (!lat || !lng || !time || !budget || !mood) {
      return NextResponse.json(
        { error: "必要なパラメータが不足しています" },
        { status: 400 }
      );
    }

    const [weatherResult, nearbyPlaces] = await Promise.allSettled([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`
      ).then((r) => r.json()),
      fetchNearbyPlaces(lat, lng, mood),
    ]);

    let weatherStr = "不明";
    if (weatherResult.status === "fulfilled") {
      const weatherData = weatherResult.value;
      const code = weatherData.current?.weather_code as number;
      const temp = weatherData.current?.temperature_2m as number;
      const desc = weatherCodes[code] || "";
      if (desc && temp != null) weatherStr = `${desc}、気温${Math.round(temp)}°C`;
    }

    const places: PlaceInfo[] =
      nearbyPlaces.status === "fulfilled" ? nearbyPlaces.value : [];

    const today = date ? new Date(date) : new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

    const seasons: Record<number, string> = {
      1: "冬", 2: "冬（立春直後）", 3: "春（初春）", 4: "春",
      5: "春（晩春）", 6: "初夏", 7: "夏", 8: "真夏",
      9: "初秋", 10: "秋", 11: "晩秋", 12: "冬",
    };

    const locationStr = [city, prefecture].filter(Boolean).join("、") || "日本";

    const placesSection =
      places.length > 0
        ? `\n【近くのスポット】\n${places.map((p, i) => `${i + 1}. ${p.name}（${p.type}）`).join("\n")}\n※上記スポットを積極的に提案に含めてください。`
        : "";

    const prompt = `日本在住者の暇な1日を充実させるアクティビティを5〜6個提案してください。

【状況】
- 日付: ${month}月${day}日（${dayOfWeek}）/ ${seasons[month]}
- 場所: ${locationStr}（電車1時間圏内も対象）
- 天気: ${weatherStr}
- 時間: ${timeLabels[time] || time}
- 予算: ${budgetLabels[budget] || budget}
- 気分: ${moodLabels[mood] || mood}${fatigue ? `\n- 体調・疲れ具合: ${{ energetic: "元気いっぱい（アクティブな提案OK）", normal: "普通", tired: "ちょっと疲れ（あまり体力を使わないものを優先）", exhausted: "かなり疲れ（ゆったりできるものを中心に）" }[fatigue as string] || fatigue}` : ""}
${companion ? `- 同行者: ${companionLabels[companion] || companion}` : ""}
${travelRange ? `- 移動範囲: ${travelRangeLabels[travelRange] || travelRange}` : ""}
${placesSection}
【提案の条件】
1. 季節特有のイベント・旬の体験を必ず2〜3個含める（${month}月なら${getSeasonalHints(month)}）
2. 上記の実際のスポットを優先的に使い、具体的な店名・施設名を入れる
3. 天気・気温に合ったアクティビティのみ提案する
4. 指定予算内で楽しめるものにする
5. 指定時間内に完結できるものにする
6. 移動範囲の制約: ${travelRange === "walk" ? "徒歩2km以内のみ" : travelRange === "30min" ? "電車・バス30分以内（約15km）" : travelRange === "1hour" ? "電車・バス1時間以内（約40km）" : "距離制限なし（遠出OK）"}
7. 合計6〜8個の多様な提案をする

JSONのみ返答（説明文不要）：

{
  "suggestions": [
    {
      "title": "アクティビティ名（15文字以内）",
      "description": "具体的な説明・魅力（60〜100文字）",
      "category": "カテゴリー（アウトドア/文化・芸術/食/スポーツ/リラックス/学び/季節イベント/ショッピング/観光 のいずれか）",
      "estimatedTime": "所要時間の目安",
      "estimatedCost": "費用の目安",
      "isSeasonalEvent": true または false,
      "seasonalNote": "季節のおすすめ理由（isSeasonalEventがtrueの場合のみ、30文字以内）",
      "tips": "実践的なアドバイス・注意点（40文字以内）",
      "placeName": "具体的な店名・施設名（実在するもの。不明な場合はnull）",
      "mapsSearchQuery": "Google Maps検索用キーワード（例：渋谷 カフェ おすすめ）",
      "startTime": "活動開始時刻（HH:MM形式、例：10:00）",
      "transport": {
        "method": "前スポットからの移動手段（徒歩/電車/バス/自転車など）",
        "duration": "移動時間（例：徒歩10分）"
      }
    }
  ],
  "summary": "今日へのポジティブな一言アドバイス（40文字以内）"
}

※10:00スタートとして各スポットに startTime を順番に設定すること。最初のスポットの transport は null にし、2番目以降は前スポットからの移動手段と時間を入れること。`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // 429レート制限時は最大3回リトライ
    let result: Awaited<ReturnType<typeof model.generateContentStream>> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await model.generateContentStream(prompt);
        break;
      } catch (e) {
        if (attempt < 2 && e instanceof Error && e.message.includes("429")) {
          await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
          continue;
        }
        throw e;
      }
    }

    // Stream response: first line is metadata, then AI text chunks
    const encoder = new TextEncoder();
    const meta = JSON.stringify({ weather: weatherStr, places });

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`__META__${meta}\n`));
        try {
          for await (const chunk of result!.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Suggest API error:", error);
    let message = "提案の生成に失敗しました。もう一度お試しください。";
    if (error instanceof Error) {
      if (error.message.includes("503")) {
        message = "AIサーバーが混雑しています。少し待ってから再試行してください。";
      } else if (error.message.includes("429")) {
        if (error.message.toLowerCase().includes("daily") || error.message.toLowerCase().includes("quota")) {
          message = "本日のAI利用上限に達しました。明日また試してください。";
        } else {
          message = "AIの一時的な制限に達しました。1分ほど待ってから再試行してください。";
        }
      } else if (error.message.includes("404")) {
        message = "AIモデルに接続できませんでした。管理者にお問い合わせください。";
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getSeasonalHints(month: number): string {
  const hints: Record<number, string> = {
    1: "初詣、書き初め、冬景色",
    2: "節分、バレンタイン、梅の花見",
    3: "ひな祭り、卒業シーズン、いちご狩り、早咲き桜",
    4: "お花見、花見弁当、春の山菜採り",
    5: "ゴールデンウィーク、こいのぼり、新緑ハイキング",
    6: "梅雨入り前の外出、紫陽花、ホタル鑑賞",
    7: "海水浴、夏祭り、花火大会、七夕",
    8: "お盆、夏祭り、海・川遊び、ひまわり畑",
    9: "秋祭り、お月見（十五夜）、ぶどう狩り",
    10: "紅葉狩り、ハロウィン、柿・栗拾い",
    11: "紅葉の見頃、七五三、新そば",
    12: "クリスマス、大掃除、年越し準備、イルミネーション",
  };
  return hints[month] || "季節のイベント";
}
