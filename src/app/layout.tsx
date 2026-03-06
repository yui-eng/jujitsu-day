import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "充実DAY - 暇な1日をもっと楽しく",
  description: "現在地・時間・予算・気分をもとに、今日の充実プランをAIが提案します。季節のイベントも含めてパーソナルな提案をお届けします。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
