export type TimeOption = "2h" | "halfday" | "allday";
export type BudgetOption = "free" | "low" | "medium" | "high";
export type FatigueOption = "energetic" | "normal" | "tired" | "exhausted";
export type MoodOption = "active" | "relaxed" | "social" | "creative" | "nature" | "foodie";
export type CompanionOption = "solo" | "friends" | "couple" | "family";
export type TravelRangeOption = "walk" | "30min" | "1hour" | "anywhere";

export interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  prefecture: string;
}

export const timeOptions: { value: TimeOption; label: string; desc: string; icon: string }[] = [
  { value: "2h", label: "2時間", desc: "ちょっと外出", icon: "⚡" },
  { value: "halfday", label: "半日", desc: "3〜5時間", icon: "🌤️" },
  { value: "allday", label: "丸1日", desc: "6時間以上", icon: "🌟" },
];

export const budgetOptions: { value: BudgetOption; label: string; desc: string }[] = [
  { value: "free", label: "無料", desc: "0円でOK" },
  { value: "low", label: "〜¥1,000", desc: "ちょっと出費" },
  { value: "medium", label: "〜¥5,000", desc: "まあまあ使う" },
  { value: "high", label: "¥5,000〜", desc: "せっかくだから" },
];

export const fatigueOptions: { value: FatigueOption; label: string; emoji: string; desc: string }[] = [
  { value: "energetic", label: "元気いっぱい", emoji: "💪", desc: "なんでもできる！" },
  { value: "normal", label: "普通", emoji: "😊", desc: "まあまあ元気" },
  { value: "tired", label: "ちょっと疲れ", emoji: "😮‍💨", desc: "あまり無理したくない" },
  { value: "exhausted", label: "かなり疲れ", emoji: "😴", desc: "ゆっくりしたい" },
];

export const moodOptions: { value: MoodOption; label: string; emoji: string; desc: string }[] = [
  { value: "active", label: "アクティブ", emoji: "🏃", desc: "体を動かしたい" },
  { value: "relaxed", label: "のんびり", emoji: "😌", desc: "ゆったり過ごしたい" },
  { value: "social", label: "わいわい", emoji: "🎉", desc: "誰かと楽しみたい" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨", desc: "何か作りたい" },
  { value: "nature", label: "自然を感じたい", emoji: "🌿", desc: "アウトドア気分" },
  { value: "foodie", label: "グルメ", emoji: "🍜", desc: "美食を楽しみたい" },
];

export const companionOptions: { value: CompanionOption; label: string; emoji: string; desc: string }[] = [
  { value: "solo", label: "ひとり", emoji: "🧍", desc: "自由気まま" },
  { value: "friends", label: "友達と", emoji: "👯", desc: "みんなで楽しく" },
  { value: "couple", label: "恋人と", emoji: "💑", desc: "ふたりで" },
  { value: "family", label: "家族と", emoji: "👨‍👩‍👦", desc: "みんな一緒に" },
];

export const travelRangeOptions: { value: TravelRangeOption; label: string; emoji: string; desc: string }[] = [
  { value: "walk", label: "徒歩圏", emoji: "🚶", desc: "近所を散策" },
  { value: "30min", label: "30分以内", emoji: "🚌", desc: "電車・バスで" },
  { value: "1hour", label: "1時間以内", emoji: "🚃", desc: "少し足を伸ばして" },
  { value: "anywhere", label: "どこでも", emoji: "✈️", desc: "遠出もOK" },
];
