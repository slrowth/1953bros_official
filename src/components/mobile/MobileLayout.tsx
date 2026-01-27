/**
 * 모바일 레이아웃 컴포넌트
 * 모바일 화면에 최적화된 레이아웃 구조
 * - 상단: MobileHeader (페이지 제목, 뒤로가기 버튼)
 * - 중앙: children (스크롤 가능한 컨텐츠 영역)
 * - 하단: MobileBottomNav (고정)
 */

"use client";

import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

interface MobileLayoutProps {
  /**
   * 페이지 제목
   */
  title: string;
  /**
   * 뒤로가기 버튼 표시 여부
   * @default true
   */
  showBackButton?: boolean;
  /**
   * 뒤로가기 버튼 클릭 시 이동할 경로
   */
  backHref?: string;
  /**
   * 헤더 우측 추가 액션
   */
  headerRightAction?: React.ReactNode;
  /**
   * 헤더 하단에 추가할 컨텐츠 (검색창 등)
   */
  headerBottomContent?: React.ReactNode;
  /**
   * 하단 네비게이션 표시 여부
   * @default true
   */
  showBottomNav?: boolean;
  /**
   * 컨텐츠 영역 추가 클래스명
   */
  contentClassName?: string;
  /**
   * 자식 컴포넌트
   */
  children: React.ReactNode;
}

export default function MobileLayout({
  title,
  showBackButton = true,
  backHref,
  headerRightAction,
  headerBottomContent,
  showBottomNav = true,
  contentClassName = "",
  children,
}: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* 상단 헤더 */}
      <MobileHeader
        title={title}
        showBackButton={showBackButton}
        backHref={backHref}
        rightAction={headerRightAction}
        bottomContent={headerBottomContent}
      />

      {/* 중앙 컨텐츠 영역 (스크롤 가능) */}
      <main
        className={`flex-1 overflow-y-auto ${
          showBottomNav ? "pb-20" : ""
        } ${contentClassName}`}
        style={showBottomNav ? { paddingBottom: `calc(5rem + env(safe-area-inset-bottom, 0))` } : undefined}
      >
        {children}
      </main>

      {/* 하단 네비게이션 */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
