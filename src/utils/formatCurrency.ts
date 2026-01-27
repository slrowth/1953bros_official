/**
 * 통화 포맷팅 유틸리티
 * 한국 원화(KRW) 형식으로 금액을 포맷팅합니다.
 */

const currencyFormatterInstance = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @param amount - 포맷팅할 금액 (숫자)
 * @returns 포맷팅된 통화 문자열 (예: "₩10,000")
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "₩0";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (Number.isNaN(numAmount) || !Number.isFinite(numAmount)) {
    return "₩0";
  }

  return currencyFormatterInstance.format(numAmount);
}

/**
 * 통화 포맷터 인스턴스를 직접 반환 (기존 코드 호환성)
 * @deprecated formatCurrency 함수 사용을 권장합니다.
 */
export const currencyFormatter = currencyFormatterInstance;
