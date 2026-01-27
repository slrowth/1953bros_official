/**
 * Mobile 레이아웃 (서버 컴포넌트)
 * 인증 및 권한 체크를 수행합니다
 */

import { headers } from "next/headers";
import { mobileAuthGuard } from "@/lib/server/auth-guard";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // 모바일 로그인 페이지는 인증 체크 제외
  if (!pathname.startsWith("/m/login")) {
    // 인증 및 권한 체크
    await mobileAuthGuard();
  }

  return <>{children}</>;
}
