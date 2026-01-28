/**
 * Mobile 레이아웃 (서버 컴포넌트)
 * 인증 체크는 middleware.ts에서 처리합니다
 */

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
