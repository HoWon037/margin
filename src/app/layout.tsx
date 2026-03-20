import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Margin",
    template: "%s | Margin",
  },
  description: "작은 비공개 독서모임을 위한 차분한 독서 기록 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-bg-alternative font-sans text-label-strong antialiased">
        {children}
      </body>
    </html>
  );
}
