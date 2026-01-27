import "./globals.css";
import GlobalContactButton from "@/components/common/GlobalContactButton";
import { updateSessionInLayout } from "@/lib/supabase/layout-session";

export const metadata = {
  title: "1953형제돼지국밥 프랜차이즈 플랫폼",
  description: "1953형제돼지국밥 프랜차이즈 수발주 및 서비스 품질 관리 플랫폼",
};

export default async function RootLayout({ children }) {
  // Supabase 세션 업데이트 (Next.js 15 proxy 마이그레이션)
  await updateSessionInLayout();

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body
        className="antialiased"
        style={{
          fontFamily:
            "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif",
        }}
      >
        {children}
        <GlobalContactButton />
      </body>
    </html>
  );
}
