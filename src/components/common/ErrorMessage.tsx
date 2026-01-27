/**
 * 에러 메시지 컴포넌트
 * 에러 발생 시 표시되는 메시지 UI
 */

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
}

export default function ErrorMessage({ 
  message, 
  onRetry,
  showWhenEmpty = false 
}: ErrorMessageProps) {
  if (!message && !showWhenEmpty) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-700">{message || "오류가 발생했습니다."}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm font-medium text-red-700 hover:text-red-900 transition"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
