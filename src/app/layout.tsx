import type { Metadata } from "next";
import "./globals.css";
import DbProvider from "@/components/DbProvider";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "ヘルスナビ - 脂質改善×減量×筋肥大",
  description: "毎日30秒で今日の食事と運動を決める健康管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 antialiased">
        <DbProvider>
          <main className="max-w-lg mx-auto pb-20 min-h-screen">
            {children}
          </main>
          <BottomNav />
        </DbProvider>
      </body>
    </html>
  );
}
