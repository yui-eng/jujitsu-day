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

export interface PlaceInfo {
  name: string;
  address: string;
  mapsUrl: string;
  websiteUrl?: string;
  rating?: number;
  type: string;
}

// Fetch nearby popular places using Google Places API (New)
async function fetchNearbyPlaces(lat: string, lng: string, mood: string): Promise<PlaceInfo[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return [];

  const typesByMood: Record<string, string[]> = {
    active: ["sports_complex", "park", "gym", "swimming_pool", "hiking_area"],
    relaxed: ["spa", "cafe", "park", "library", "art_gallery"],
    social: ["restaurant", "bar", "amusement_park", "bowling_alley", "karaoke"],
    creative: ["art_gallery", "museum", "art_studio", "craft_store", "library"],
    nature: ["park", "national_park", "botanical_garden", "beach", "hiking_area"],
    foodie: ["restaurant", "cafe", "bakery", "food_court", "market"],
  };

  const types = typesByMood[mood] || ["tourist_attraction", "restaurant", "park"];

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.websiteUri,places.googleMapsUri,places.rating,places.primaryTypeDisplayName",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
              radius: 50000.0,
            },
          },
          includedTypes: types,
          maxResultCount: 10,
          rankPreference: "POPULARITY",
          languageCode: "ja",
        }),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const places: PlaceInfo[] = (data.places || []).map(
      (p: {
        displayName?: { text: string };
        formattedAddress?: string;
        googleMapsUri?: string;
        websiteUri?: string;
        rating?: number;
        primaryTypeDisplayName?: { text: string };
      }) => ({
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        mapsUrl: p.googleMapsUri || "",
        websiteUrl: p.websiteUri,
        rating: p.rating,
        type: p.primaryTypeDisplayName?.text || "",
      })
    );

    return places;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, city, prefecture, time, budget, mood, date } = await req.json();

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
        ? `\n【電車1.5時間圏内（約50km）の実際の人気スポット】\n${places
            .map(
              (p, i) =>
                `${i + 1}. ${p.name}（${p.type}）- ${p.address}${p.rating ? ` ★${p.rating}` : ""}`
            )
            .join("\n")}\n※上記のスポットを積極的に提案に含めてください。`
        : "";

    const prompt = `あなたは日本在住者の暇な1日を充実させるアクティビティ提案の専門家です。

【今日の状況】
- 日付: ${month}月${day}日（${dayOfWeek}曜日）/ ${seasons[month]}
- 場所: ${locationStr}（電車1.5時間圏内のエリアも対象）${weatherStr ? `\n- 天気: ${weatherStr}` : ""}
- 使える時間: ${timeLabels[time] || time}
- 予算: ${budgetLabels[budget] || budget}
- 気分: ${moodLabels[mood] || mood}
${placesSection}
【提案の条件】
1. 季節特有のイベント・旬の体験を必ず2〜3個含める（${month}月なら${getSeasonalHints(month)}）
2. 上記の実際のスポットを優先的に使い、具体的な店名・施設名を入れる
3. 天気・気温に合ったアクティビティのみ提案する
4. 指定予算内で楽しめるものにする
5. 指定時間内に完結できるものにする
6. 電車1.5時間圏内（約50km）で行けるものを対象にする
7. 合計6〜8個の多様な提案をする

以下のJSON形式のみで回答してください（前後に説明文不要）：

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
      "mapsSearchQuery": "Google Maps検索用キーワード（例：渋谷 カフェ おすすめ）"
    }
  ],
  "summary": "今日へのポジティブな一言アドバイス（40文字以内）"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContentStream(prompt);

    // Stream response: first line is metadata, then AI text chunks
    const encoder = new TextEncoder();
    const meta = JSON.stringify({ weather: weatherStr, places });

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`__META__${meta}\n`));
        try {
          for await (const chunk of result.stream) {
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
        message = "AIの利用上限に達しました。しばらく時間をおいてから再試行してください。";
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
