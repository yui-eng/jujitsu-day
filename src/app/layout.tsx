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
      <body className="antialiased">
        {/* Background image with whitish filter */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "url('/bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(1.05) saturate(0.75)",
            zIndex: -2,
          }}
        />
        {/* White overlay to make it feel light and airy */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255, 255, 255, 0.58)",
            zIndex: -1,
          }}
        />
        {children}
      </body>
    </html>
  );
}
