/**
 * 날짜 포맷팅 유틸리티
 * 날짜를 다양한 형식으로 포맷팅합니다.
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (Date 객체, 문자열, 또는 null/undefined)
 * @returns 포맷팅된 날짜 문자열 (예: "2025-01-26") 또는 "미정"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "미정";
  }

  const parsed = typeof date === "string" ? new Date(date) : date;
  
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "미정";
  }

  return parsed.toISOString().slice(0, 10);
}

/**
 * 날짜를 YYYY-MM-DD HH:mm 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (Date 객체, 문자열, 또는 null/undefined)
 * @returns 포맷팅된 날짜/시간 문자열 (예: "2025-01-26 14:30") 또는 "미정"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return "미정";
  }

  const parsed = typeof date === "string" ? new Date(date) : date;
  
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "미정";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 날짜를 YYYY년 MM월 DD일 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (Date 객체, 문자열, 또는 null/undefined)
 * @returns 포맷팅된 날짜 문자열 (예: "2025년 1월 26일") 또는 "미정"
 */
export function formatDateKorean(date: Date | string | null | undefined): string {
  if (!date) {
    return "미정";
  }

  const parsed = typeof date === "string" ? new Date(date) : date;
  
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "미정";
  }

  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}
