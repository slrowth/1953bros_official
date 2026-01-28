/**
 * 에러 메시지 컴포넌트
 * 에러 발생 시 표시되는 메시지 UI
 */

import { useRouter } from "next/navigation";

interface ErrorMessageProps {
  /**
   * 에러 메시지
   */
  message: string | null | undefined;
  /**
   * 다시 시도 버튼 클릭 핸들러
   */
  onRetry?: () => void;
  /**
   * 에러 메시지가 없을 때 표시 여부
   * @default false
   */
  showWhenEmpty?: boolean;
  /**
   * 인증 에러인지 여부 (로그인 버튼 표시)
   * @default false
   */
  isAuthError?: boolean;
  /**
   * 로그인 페이지 경로
   * @default "/m/login"
   */
  loginPath?: string;
}

export default function ErrorMessage({ 
  message, 
  onRetry,
  showWhenEmpty = false,
  isAuthError = false,
  loginPath = "/m/login"
}: ErrorMessageProps) {
  const router = useRouter();
  
  if (!message && !showWhenEmpty) {
    return null;
  }

  // 인증 에러인지 자동 감지 (메시지에 "인증" 키워드가 포함된 경우)
  const isAuth = isAuthError || (message && (
    message.includes("인증") || 
    message.includes("401") || 
    message.includes("Unauthorized")
  ));

  return (
    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-700">{message || "오류가 발생했습니다."}</p>
        <div className="flex items-center gap-2">
          {isAuth && (
            <button
              onClick={() => {
                const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
                const redirectPath = currentPath !== "/m" ? currentPath : "";
                router.push(`${loginPath}${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-[#967d5a] hover:bg-[#7a6548] rounded-lg transition"
            >
              로그인하기
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
