/**
 * Mobile 레이아웃 (서버 컴포넌트)
 * 인증 및 권한 체크를 수행합니다
 */

import { headers } from "next/headers";
import { mobileAuthGuard } from "@/lib/server/auth-guard";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  // 현재 경로 확인 (referer 헤더 사용)
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const pathname = referer ? new URL(referer).pathname : "";

  // 모바일 로그인 페이지는 인증 체크 제외
  if (!pathname.startsWith("/m/login")) {
    try {
      await mobileAuthGuard();
    } catch (error) {
      // 리다이렉트는 authGuard 내부에서 처리
    }
  }

  return <>{children}</>;
}
