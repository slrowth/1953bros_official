/**
 * 로딩 스피너 컴포넌트
 * 데이터 로딩 중 표시되는 스피너 UI
 */

interface LoadingSpinnerProps {
  /**
   * 로딩 메시지
   * @default "로딩 중..."
   */
  message?: string;
  /**
   * 스피너 크기 (픽셀)
   * @default 12
   */
  size?: number;
  /**
   * 전체 화면 높이 사용 여부
   * @default true
   */
  fullHeight?: boolean;
}

export default function LoadingSpinner({ 
  message = "로딩 중...", 
  size = 12,
  fullHeight = true 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${fullHeight ? "min-h-[60vh]" : ""}`}>
      <div className="text-center">
        <div 
          className="animate-spin rounded-full border-b-2 border-[#967d5a] mx-auto"
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
        ></div>
        {message && (
          <p className="mt-4 text-sm text-slate-500">{message}</p>
        )}
      </div>
    </div>
  );
}
