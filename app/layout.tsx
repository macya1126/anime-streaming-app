import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOPBOX",
  description: "アニメ・映画のサブスク横断検索アプリ",
  manifest: "/manifest.json",
  themeColor: "#FFE600",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LOOPBOX",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFE600" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LOOPBOX" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}