import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOPBOX",
  description: "アニメ・映画のサブスク横断検索アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}