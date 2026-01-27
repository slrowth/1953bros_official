/**
 * 모바일 헤더 컴포넌트
 * 페이지 제목과 뒤로가기 버튼을 포함하는 상단 헤더
 */

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MobileHeaderProps {
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
   * 지정하지 않으면 브라우저 뒤로가기 실행
   */
  backHref?: string;
  /**
   * 추가 액션 버튼 (우측)
   */
  rightAction?: React.ReactNode;
  /**
   * 헤더 하단에 추가할 컨텐츠 (검색창 등)
   */
  bottomContent?: React.ReactNode;
}

export default function MobileHeader({
  title,
  showBackButton = true,
  backHref,
  rightAction,
  bottomContent,
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 border-b border-neutral-200 bg-white" 
      style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
    >
      {/* 상단: 제목과 액션 버튼 */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-neutral-100 active:bg-neutral-200"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900">
            {title}
          </h1>
        </div>
        {rightAction && (
          <div className="ml-2 shrink-0">{rightAction}</div>
        )}
      </div>
      {/* 하단: 추가 컨텐츠 (검색창 등) */}
      {bottomContent && (
        <div className="bg-white">
          {bottomContent}
        </div>
      )}
    </header>
  );
}
