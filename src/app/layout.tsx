import type { Metadata } from "next";
import { Dancing_Script, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-dancing",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Joie - 今日のお出かけプラン",
  description: "現在地・時間・予算・気分をもとに、今日の充実プランをAIが提案します。",
  openGraph: {
    title: "Joie - 今日のお出かけプラン",
    description: "現在地・時間・予算・気分をもとに、今日の充実プランをAIが提案します。",
    images: [{ url: "/bg.jpg", width: 1200, height: 630 }],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joie - 今日のお出かけプラン",
    description: "現在地・時間・予算・気分をもとに、今日の充実プランをAIが提案します。",
    images: ["/bg.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${dancing.variable} ${cormorant.variable} antialiased`}>
        {/* Background image */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "url('/bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(1.05) saturate(0.8)",
            zIndex: -2,
          }}
        />
        {/* Subtle white overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255, 255, 255, 0.22)",
            zIndex: -1,
          }}
        />
        {children}
      </body>
    </html>
  );
}
